export let uid = ""
export let user = {}
export let users = []

export function setUserData(data){
  uid = data.uid
  user = data
}

export function openDatabase(cb){
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