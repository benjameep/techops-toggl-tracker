import './assets/primer.css'
import './assets/styleguide.css'
import './assets/style.css';

import fontawesome from "@fortawesome/fontawesome";
import faChevronLeft from "@fortawesome/fontawesome-free-solid/faChevronLeft";
import faChevronRight from "@fortawesome/fontawesome-free-solid/faChevronRight";
import faPencilAlt from "@fortawesome/fontawesome-free-solid/faPencilAlt";
import faCodeBranch from "@fortawesome/fontawesome-free-solid/faCodeBranch";
import faTrashAlt from "@fortawesome/fontawesome-free-solid/faTrashAlt";
fontawesome.library.add(faChevronLeft,faChevronRight,faPencilAlt,faCodeBranch,faTrashAlt);

import * as pages from './pages'
import * as database from './scripts/database'
import * as toggl from './scripts/toggl'

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
window.firebase = firebase
firebase.initializeApp({
  apiKey: "AIzaSyDivGb3qYsVppVyWu0kQP9TsMxJKVI_2EE",
  authDomain: "toggl-collection.firebaseapp.com",
  databaseURL: "https://toggl-collection.firebaseio.com",
  projectId: "toggl-collection",
  storageBucket: "toggl-collection.appspot.com",
  messagingSenderId: "321698368957"
})

firebase.auth().onAuthStateChanged(user => {
  if(user){
    // User is logged in, 
    database.setUserData({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid,
      admin: false
    })
    database.openDatabase(err => {
      if(err){ return pages.error(err) }
      main()
    })
  } else {
    // User not logged in, redirect to login page
    pages.login()
  }
})

function openpage(){
  var loc = (location.hash||'#timetracking').slice(1)
  if(!pages[loc]){
    pages.error({message:`404: Couldn't find ${location.hash}`})
    console.error('404:',location.hash)
    return
  } else {
    pages[loc]()
  }
}

function main(){
  window.addEventListener('hashchange',openpage)
  openpage()
  console.log('database')
  console.log(database.users)
}