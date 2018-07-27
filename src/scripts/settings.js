import { get } from './toggl'
import { user } from './database'

function injectWorkspaces(){
  get('/api/v8/workspaces').then(workspaces => {
    // TODO: create a dynamic radio button array with which workspace to use
    // (may be called multiple times)
  }).catch(e => {
    throw new Error('current token is invalid: '+e)
  })
}

function save() {
  var toggltoken = document.getElementById('togglToken').value
  var workspace // TODO: if the workspace has been displayed, give the selected's id, otherwise undefined
  if (!toggltoken && !user.toggltoken) {
    throw new Error('no toggl token entered')
  }
  get('/api/v9/me',toggltoken || user.toggltoken)
    .then(() => firebase.database().ref(`users/${uid}/toggltoken`).set(toggltoken || user.toggltoken))
    .then(() => {
      if (workspace != undefined) {
        firebase.database().ref(`users/${uid}/workspace`).set(workspace)
          .then(() => window.location.href = "./index.html")
      }
    })
    .catch(() => {
      // TODO actually display an error
      throw new Error("Bad token")
    })
}

export default function(){
  document.getElementById('settings-save').addEventListener('click',() => {
    save()
  })
}