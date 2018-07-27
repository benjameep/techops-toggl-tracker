import { chartTitle } from './time'

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

export default function(){

  [forward,backward,week,month,title] = sels.map(s => document.querySelector(s))

  setDFC(getDFC())
  title.innerText = chartTitle()
  
  backward.addEventListener('click',() => {
    if(backward.classList.contains('disabled')){return}
    setDFC(getDFC() + 1)
    title.innerText = chartTitle()
  })
  
  forward.addEventListener('click',() => {
    if(forward.classList.contains('disabled')){return}
    setDFC(getDFC() - 1)
    title.innerText = chartTitle()
  })
  
  week.addEventListener('click',() => {
    if((localStorage.timeunit||'week') == 'week'){return}
    setDFC('0')
    localStorage.timeunit = 'week'
    week.classList.add('selected')
    month.classList.remove('selected')
    title.innerText = chartTitle()
  })
  
  month.addEventListener('click',() => {
    if(localStorage.timeunit == 'month'){return}
    setDFC('0')
    localStorage.timeunit = 'month'
    month.classList.add('selected')
    week.classList.remove('selected')
    title.innerText = chartTitle()
  })
}