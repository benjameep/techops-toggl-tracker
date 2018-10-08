import  * as d3 from 'd3'


export let uid = ""
export let user = {}
export let users = []

export function setUserData(data){
  uid = data.uid
  user = data
}

export function onUserData(cb){
  var usersdb = firebase.database().ref('users');
  usersdb.child(user.uid).on('value',snapshot => {
    var snap = snapshot.val()
    if(snap == null){
      usersdb.child(user.uid).set(user)
      return
    }
    if(snap.admin == true){
      usersdb.on('value', snapshot => {
        users = snapshot.val();
        user = users[uid]
        cb(null);
      },cb)
    } else {
      users = {[user.uid]:snap}
      user = snap
      cb(null)
    }
  },cb)
}

export function projects(cb){
  var ref = firebase.database().ref('projects')
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
  var pids = entries.reduce((obj,entry) => (obj[entry.pid] = {name:entry.project,pid:null},obj),{})
  await Promise.all(Object.keys(pids).map(togglpid => new Promise((resolve,reject) => {
    pidsref.child(togglpid).once('value',snapshot => {
      /* Update that list with the databases current value */
      pids[togglpid].pid = snapshot.val()
      resolve()
    },reject)
  })))
  return pids
}

function getProjectUpdates(db, pids, entries, updates) {
  let projectsref = db.ref('projects')

  /* Create new projects that weren't in the mappings */
  Object.entries(pids).filter(n => !n[1].pid).forEach(([togglpid]) => {
    let pid = pids[togglpid].pid = projectsref.push().key;
    updates[`pidmapping/${togglpid}`] = pid;
    updates[`projects/${pid}/color`] = d3.interpolateRainbow(Math.random());
    updates[`projects/${pid}/name`] = pids[togglpid].name;
  });
  /* Update existing projects */
  entries.forEach(entry => {
    let pid = pids[entry.pid].pid;
    updates[`projects/${pid}/pids/${entry.pid}`] = entry.project;
    updates[`projects/${pid}/users/${entry.uid}`] = entry.user;
    updates[`projects/${pid}/days/${entry.day}`] = true;
  });
}

function getEntryUpdates(db, entries, updates) {
  /* Update the dailysum entries */
  const watchlist = {};
  entries.forEach(entry => {
    let { day, pid, uid, id, time } = entry;
    let path = `dailysums/${day}/projects/${pid}/users/${uid}`;
    watchlist[path] = watchlist[path] || { entry: entry, diff: 0 };
    updates[path + '/entries/' + id] = Math.floor((time[1] - time[0]) / 1000);
  });
  
  return watchlist
}

async function createWatchers(db,watchlist){
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
        var entries = snapshot.val().entries;
        var sum = Object.values(entries).reduce((a, b) => a + b);
        // Record the difference (using this to add to sum of parents)
        var diff = sum - initialvalue;
        watchlist[path].diff = diff;
      }
    }, reject);
  })));
}

async function getSumUpdates(db,watchlist){
  // Create list of paths to update
  var diffs = {}
  const add = (key,val) => diffs[key] ? diffs[key] += val : diffs[key] = val
  Object.keys(watchlist).forEach(path => {
    if(watchlist[path].diff){
      var {day,pid,uid} = watchlist[path].entry
      add(`dailysums/${day}/projects/${pid}/users/${uid}/sum`,watchlist[path].diff)
      add(`dailysums/${day}/projects/${pid}/sum`,watchlist[path].diff)
      add(`dailysums/${day}/sum`,watchlist[path].diff)
    }
  })
  // Retrieve the current values and save the sum
  var sumupdates = {}
  await Promise.all(Object.entries(diffs).map(([path,diff]) => new Promise((resolve,reject) => {
    db.ref(path).once('value',snapshot => {
      var val = +snapshot.val()
      sumupdates[path] = val+diff
      resolve()
    },reject)
  })))
  return sumupdates
}

export async function updateDatabase(entries){
  var db = firebase.database()

  // Gathering all of the updates, to be sent in a single
  // more efficient post request
  let updates = {}

  // Get list of known project mappings
  let pids = await getPids(db,entries)
  
  // Add updates for the project information and create the ones that didn't exist
  getProjectUpdates(db, pids, entries, updates)

  // Add updates for the entries
  // returns a list of paths that need to be watched
  var watchlist = getEntryUpdates(db,entries,updates)

  // Create watchers on all the entries we are updating
  // so that we know which ones get changed
  var watchers = await createWatchers(db,watchlist)
  
  // Send the updates for the projects and entries
  await db.ref().update(updates)
  
  // All of the updates are done and the watchlist has been
  // filled out with the diffs, so now we can remove all of
  // the watchers
  watchers.forEach(watcher => watcher.off())

  // Get updates for parent sums that need to be incremented
  var sumupdates = await getSumUpdates(db,watchlist)
  
  // Send the update of all the sums that need to be incremented
  await db.ref().update(sumupdates)
}