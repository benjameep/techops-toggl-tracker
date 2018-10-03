import * as time from './time'
import { report } from './toggl'
import * as database from './database'
import * as draw from './draw'

const sels = ['.time-button.forwards','.time-button.backwards','button[data-timeunit="week"]','button[data-timeunit="month"]','.chart-title']
let forward,backward,week,month,title

function setDFC(dist){
  if(isNaN(dist)){
    return console.error('Not a Number',dist)
  }
  if(dist == '0'){
    forward.classList.add('disabled')
  } else {
    forward.classList.remove('disabled')
  }
  localStorage.distanceFromCurrent = dist
}
function getDFC(){
  if(isNaN(localStorage.distanceFromCurrent)){
    setDFC('0')
    return 0
  } else {
    return Number(localStorage.distanceFromCurrent)
  }
}

function loadChart(){
  var container = document.querySelector('.svg-container')
  // if not set then true
  var isWeek = (localStorage.timeunit || 'week') == 'week'
  title.innerText = time.chartTitle()
  var period = time.getPeriod()
  // retrieve the data from toggl
  // TODO: change which user it is getting based on dropdown
  report(period,database.user).then(data => {
    draw.scheduleChart(container,period,isWeek,data)
  }).catch(e => { throw e })
}

export default function(){
  
  [forward,backward,week,month,title] = sels.map(s => document.querySelector(s))

  setDFC(getDFC())
  loadChart()
  
  backward.addEventListener('click',() => {
    if(backward.classList.contains('disabled')){return}
    setDFC(getDFC() + 1)
    loadChart()
  })
  
  forward.addEventListener('click',() => {
    if(forward.classList.contains('disabled')){return}
    setDFC(getDFC() - 1)
    loadChart()
  })
  
  week.addEventListener('click',() => {
    if((localStorage.timeunit||'week') == 'week'){return}
    setDFC('0')
    localStorage.timeunit = 'week'
    week.classList.add('selected')
    month.classList.remove('selected')
    loadChart()
  })
  
  month.addEventListener('click',() => {
    if(localStorage.timeunit == 'month'){return}
    setDFC('0')
    localStorage.timeunit = 'month'
    month.classList.add('selected')
    week.classList.remove('selected')
    loadChart()
  })

  // TODO: Add listener to change user dropdown
}