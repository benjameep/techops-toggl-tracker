import _nav_ from './templates/nav.ejs'
import _sidebar_ from './templates/sidebar.ejs'
import _chart_ from './templates/chart.ejs'
import _settings_ from './templates/settings.ejs'
import _projects_ from './templates/projects.ejs'
import _error_ from './templates/error.ejs'

import chartEventHandlers from './scripts/chart'
import projectsEventHandlers from './scripts/projects'
import settingsEventHandlers from './scripts/settings'
import loginEventHandlers from './scripts/login'
import * as database from './scripts/database'

let loaded = false
let onload
window.addEventListener('load',() => {
  loaded = true
  onload && onload()
})

export function timetracking(data){
  if(!loaded){ return onload = () => timetracking(data) }
  var html = _nav_({ includeSettingsButton: true });
  html += _sidebar_({
    page:'timetracking', 
    _main_:_chart_,
    data:Object.assign({isPersonal:true},data)
  })
  document.body.innerHTML = html
  chartEventHandlers()
}

export function team(data){
  if(!loaded){ return onload = () => team(data) }
  var html = _nav_({ includeSettingsButton: true });
  html += _sidebar_({
    page:'team',
    _main_:_chart_,
    data:Object.assign({isPersonal:false},data)
  })
  document.body.innerHTML = html
  chartEventHandlers()
}

export function settings(data){
  if(!loaded){ return onload = () => settings(data) }
  var html = _nav_({ includeSettingsButton: false });
  html += _settings_(data)
  document.body.innerHTML = html
  settingsEventHandlers()
}

export function projects(data){
  if(!loaded){ return onload = () => projects(data) }
  var html = _nav_({ includeSettingsButton: true });
  html += _sidebar_({
    page:'projects',
    _main_:_projects_,
    data:data
  })
  document.body.innerHTML = html
  projectsEventHandlers()
}

export function login(){
  if(!loaded){ return onload = () => login() }
  var html = _nav_({ includeSettingsButton: false })
  html += '<div class="pt-6" id="firebaseui-auth-container"></div>'
  document.body.innerHTML = html
  loginEventHandlers()
}

export function error(err){
  if(!loaded){ return onload = () => error(err) }
  var html = _nav_({ includeSettingsButton: false })
  html += _error_(err)
  document.body.innerHTML = html
}