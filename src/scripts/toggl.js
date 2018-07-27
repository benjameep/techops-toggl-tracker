import * as database from './database'
import { error } from '../pages'

export function get(path,token=database.user.toggltoken){
  if(token==undefined){
    error({message:'Toggl Api Token was not set'})
  }
  return fetch('https://toggl.com'+path,{
    headers: {
      Authorization:'Basic '+btoa(token+':api_token')
    }
  }).then(r => r.json())
}