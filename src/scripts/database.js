import  * as d3 from 'd3'
import * as toggl from './toggl'

export let uid = ""
export let user = {}
export let users = []

function on(path,cb){
  const db = firebase.database()
  var first = true
  var ref = typeof path == 'string' ? db.ref(path) : path
  return new Promise((resolve,reject) => {
    ref.on('value',snapshot => {
      if(first){
        resolve(snapshot.val())
        if(!cb) ref.off()
        first = false
      } else {
        cb(snapshot)
      }
    },reject)
  })
}

export function setUserData(data){
  uid = data.uid
  user = data

  var updates = {}
  for(var key in data){
    updates[`users/${uid}/${key}`] = data[key]
  }

  console.groupCollapsed(`updating user ${uid}`)
  console.log(updates)
  console.groupEnd()

  firebase.database().ref().update(updates).catch(err => {
    console.error('error writing the data')
    console.log(err)
  })
}

export function onUserData(cb){
  console.log('onUserData')
  const db = firebase.database()
  var usersdb = db.ref('users');
  usersdb.on('value',snapshot => {
    console.log('got a response',snapshot.val())
    users = snapshot.val();
    user = users[uid]
    cb(null);
  },cb)
}

export function projects(cb){
  const db = firebase.database()
  var ref = db.ref('projects')
  return new Promise((res,rej) => ref.once('value',snapshot => {
    var obj = {}
    snapshot.forEach(child => {
      obj[child.key] = child.val()
    })
    res(obj)
  },rej))
}

async function getPids(db,entries){
  var pidsref = db.ref('pidmapping')
  /* Get list of unique pids */
  var pids = entries.reduce((obj,entry) => (obj[entry.pid] = {},obj),{})
  await Promise.all(Object.keys(pids).map(togglpid => new Promise((resolve,reject) => {
    pidsref.child(togglpid).once('value',snapshot => {
      /* Update that list with the databases current value */
      pids[togglpid].pid = snapshot.val()
      resolve()
    },reject)
  })))
  return pids
}

async function getProjectUpdates(db, pids, entries, usr, updates) {
  let projectsref = db.ref('projects')

  /* Create new projects that weren't in the mappings */
  const newProjects = Object.entries(pids).filter(n => !n[1].pid)

  await Promise.all(newProjects.map(async ([togglpid]) => {
    let { data } = togglpid != 'undefined' ?
      await toggl.get(`/api/v8/projects/${togglpid}`,users[usr].toggltoken) :
      ({ data: { hex_color:'#bbbbbb', name:'[no project]' } })

    let pid = pids[togglpid].pid = projectsref.push().key;
    updates[`pidmapping/${togglpid}`] = pid;
    updates[`projects/${pid}/color`] = data.hex_color || d3.hsl(Math.random()*360,1.5,0.28).hex()
    updates[`projects/${pid}/name`] = data.name
  }))

  /* Update existing projects */
  entries.forEach(entry => {
    let pid = pids[entry.pid].pid;
    updates[`projects/${pid}/pids/${entry.pid}`] = entry.pid||'undefined';
    updates[`projects/${pid}/users/${entry.uid}`] = entry.uid;
    updates[`projects/${pid}/days/${entry.day}`] = true;
    updates[`dailysums/${entry.day}/pids/${entry.pid}/${entry.uid}`] = true;
  });
}

function getEntryUpdates(entries, updates) {
  /* Update the dailysum entries */
  const watchlist = {};
  
  entries.forEach(entry => {
    let { day, pid, uid, id, duration } = entry;
    let path = `dailysums/${day}/projects/${pid}/users/${uid}`
    updates[path] = updates[path] || {entries:{},sum:0}
    watchlist[path] = entry.day
    updates[path].entries[id] = duration
    updates[path].sum += duration
  })
  
  return watchlist
}

async function removeMissingEntries(db,[start,end],entries,usr,updates,daysThatNeedUpdates){
  const dailysums = db.ref('dailysums')
  const delimiter = ';'
  
  var used = entries.reduce((o,e) => (o[e.day+delimiter+e.pid] = true,o),{})

  var alldays = Array(end.diff(start,'days')).fill()
    .map((n,i) => start.clone().add(i,'days').format('MM-DD-YYYY'))
  
  await Promise.all(alldays.map(day => new Promise((resolve,reject) => {
    dailysums.child(day+'/pids').once('value',snapshot => {
      if(snapshot.exists()){
        let pids = snapshot.val()
        let removalupdates = {}

        /* Find the projects we no longer work on */
        Object.keys(pids)
          .filter(pid => pids[pid][usr]) // Those that say we should be using it
          .filter(pid => !used[day+delimiter+pid]) // But we actually aren't
          .forEach(pid => {
            // Remove them
            delete pids[pid][usr]
            removalupdates = {
              [`dailysums/${day}/pids/${pid}/${usr}`]: null,
              [`dailysums/${day}/projects/${pid}/users/${usr}`]:null
            }
            daysThatNeedUpdates[day] = true // update sums
            console.info(`${usr} was removed from project ${pid}`)
          })
          
        /* Clean up projects with no users */
        Object.keys(pids)
          .filter(pid => !Object.keys(pids[pid]).length)
          .forEach(pid => {
            delete pids[pid]
            removalupdates = {
              [`dailysums/${day}/pids/${pid}`]: null,
              [`dailysums/${day}/projects/${pid}`]:null
            }
            daysThatNeedUpdates[day] = true // update sums
            console.info(`project ${pid} was removed`)
          })

        /* Remove the entire day if it has nothing left */
        if(!Object.keys(pids).length){
          removalupdates = {
            [`dailysums/${day}`]: null,
          }
          delete daysThatNeedUpdates[day]
          console.info(`day ${day} was removed`)
        }
        Object.assign(updates,removalupdates)
      }
      resolve()
    },reject)
  })))
}

async function createWatchers(db,watchlist,daysThatNeedUpdates){
  /* Create List of watchers and wait for them to get their initial value */
  return await Promise.all(Object.keys(watchlist).map(path => new Promise((resolve, reject) => {
    var initialvalue = undefined;
    var ref = db.ref(path);
    ref.on('value', snapshot => {
      if (initialvalue == undefined) {
        // Save the initial value
        var val = snapshot.val();
        initialvalue = val && val.sum ? val.sum : 0;
        // Resolving on the first call so that it knows when the 
        // the watcher is set up
        // Returning the reference so that it can be turned off later
        resolve(ref);
      }
      else {
        // We are being called again which means that there was
        // an update to the database and all the sums need to be updated
        daysThatNeedUpdates[watchlist[path]] = true
      }
    }, reject);
  })));
}

async function updateSums(db,daysThatNeedUpdates){
  const dailysums = db.ref('dailysums')
  const updates = {}
  await Promise.all(Object.keys(daysThatNeedUpdates).map(day => new Promise((resolve,reject) => {
    dailysums.child(day+'/projects').once('value',snapshot => {
      var projects = snapshot.val()
      if(!projects) console.error('trying to update a project that doesn\'t exist')
      var daysum = 0
      Object.entries(projects).forEach(([pid,project]) => {
        var projectsum = 0
        Object.entries(project.users).forEach(([uid,user]) => {
          var usersum = 0
          Object.values(user.entries).forEach(entry => usersum += entry)
          updates[`dailysums/${day}/projects/${pid}/users/${uid}/sum`] = usersum
          projectsum += usersum
        })
        updates[`dailysums/${day}/projects/${pid}/sum`] = projectsum
        daysum += projectsum
      })
      updates[`dailysums/${day}/sum`] = daysum
      resolve()
    },reject)
  })))
  return updates
}

export async function syncDatabase(period,entries,usr){
  
  toggl.get(`/api/v8/time_entries?start_date=${period[0].toISOString()}&end_date=${period[1].toISOString()}`,user.toggltoken)

  const db = firebase.database()

  // Gathering all of the updates, to be sent in a single
  // more efficient post request
  let updates = {}

  // Get list of known project mappings
  let pids = await getPids(db,entries)

  console.debug('pids',pids)
  
  // Add updates for the project information and create the ones that didn't exist
  await getProjectUpdates(db, pids, entries, usr, updates)

  // Add updates for the entries
  // returns a list of paths that need to be watched
  var watchlist = getEntryUpdates(entries,updates)
  
  let daysThatNeedUpdates = {}
  await removeMissingEntries(db,period,entries,usr,updates,daysThatNeedUpdates)

  // Create watchers on all the entries we are updating
  // so that we know which ones get changed
  var watchers = await createWatchers(db,watchlist,daysThatNeedUpdates)
  
  // console.debug('updates',updates)
  console.debug('updates',updates)

  // Send the updates for the projects and entries
  await db.ref().update(updates)
  
  // All of the updates are done and the watchlist has been
  // filled out with the diffs, so now we can remove all of
  // the watchers
  watchers.forEach(watcher => watcher.off())

  console.debug('daysThatNeedUpdates',daysThatNeedUpdates)

  // Get updates for parent sums that need to be incremented
  var sumupdates = await updateSums(db,daysThatNeedUpdates)
  
  console.debug('sumupdates',sumupdates)
  
  // Send the update of all the sums that need to be incremented
  await db.ref().update(sumupdates)
}

export function ProjectWatcher(cb){
  const nullfn = () => {}
  const db = firebase.database()
  const projectsref = db.ref('projects')

  const projects = {}
  const watchers = {}
  const pidmapping = {}

  const watcher = {}
  let onproject = cb || nullfn

  async function watch(tpid,ispushing=true){
    if(!pidmapping[tpid]){
      pidmapping[tpid] = await on('pidmapping/'+tpid,snapshot => {
        // If the mapping changed later
        console.info(`mapping for ${tpid} changed from ${pidmapping[tpid]} to ${snapshot.val()}`)
        pidmapping[tpid] = snapshot.val()
        watch(tpid)
      })
    }
    var pid = pidmapping[tpid]

    // If there was already a watcher there turn it off
    if(watchers[tpid] && watchers[tpid].off) watchers[tpid].off()

    watchers[tpid] = projectsref.child(pid+"")

    projects[tpid] = await on(watchers[tpid],snapshot => {
      // If project data changed later
      console.groupCollapsed(`project for ${tpid} was modified`)
      console.log('from:',projects[tpid])
      console.log('to:',snapshot.val())
      console.groupEnd()
      projects[tpid] = snapshot.val()
      onproject(projects)
    })
    if(ispushing) onproject(projects)
  }

  watcher.watch = function(tpids){
    tpids = Array.isArray(tpids) ? tpids : [tpids]
    tpids = tpids.filter(tpid => watchers[tpid] == undefined && (watchers[tpid] = 'waiting'))
    Promise.all(tpids.map(tpid => watch(tpid,false))).then(() => onproject(projects))
    return watcher
  }
  watcher.onproject = cb => ( onproject = cb, watcher )

  return watcher
}

export async function projectSums([start,end]){
  const db = firebase.database()
}