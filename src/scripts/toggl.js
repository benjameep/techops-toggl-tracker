import * as database from './database'
import { error } from '../pages'
import moment from 'moment'

export function get(path,token=database.user.toggltoken){
  if(token==undefined){
    throw new Error('Toggl Api Token was not set')
  }
  return fetch('https://toggl.com'+path,{
    headers: {
      Authorization:'Basic '+btoa(token+':api_token')
    }
  }).then(r => r.json())
}

export async function report([start,end],user){
  var path = page => `/reports/api/v2/details?user_agent=bananas&workspace_id=${user.workspace}&since=${start.format('YYYY-MM-DD')}&until=${end.format('YYYY-MM-DD')}&page=${page}`
  var page=1,data=[],body
  do{
    body = await get(path(page),user.toggltoken)
    data = data.concat(body.data)
    page++
  } while(body.data.length >= body.per_page)

  data.forEach(task => {
    task.start = moment(task.start)
    task.end = moment(task.end)
    var day = task.start.clone().startOf('day')
    task.time = [task.start,task.end].map(d => d.diff(day))
    task.day = task.start.format('MM-DD-YYYY')
    task.uid = user.uid
  })
  console.log('toggldata:',data)

  // Not waiting for the database to be updated
  // caller should just use the data listeners to keep updated
  // (faster load time)
  database.updateDatabase(data)
  
  return data
}