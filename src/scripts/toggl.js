import * as database from './database'
import { error } from '../pages'
import moment from 'moment'

export function get(path, token) {
    if (token == undefined) {
        throw new Error('Toggl Api Token was not set')
    }
    return fetch('https://toggl.com' + path, {
        headers: {
            Authorization: 'Basic ' + btoa(token + ':api_token')
        }
    }).then(r => r.json())
}

export async function report([start, end], user) {

    // var path = page => `/reports/api/v2/details?user_agent=bananas&workspace_id=${user.workspace}&since=${start.format('YYYY-MM-DD')}&until=${end.format('YYYY-MM-DD')}&page=${page}`
    const path = `/api/v8/time_entries?start_date=${start.toISOString()}&end_date=${end.toISOString()}`
    
    const entries = await get(path, user.toggltoken)

    entries.forEach(entry => {
        entry.start = moment(entry.start)
        entry.end = moment(entry.stop)
        var day = entry.start.clone().startOf('day')
        entry.time = [entry.start, entry.end].map(d => d.diff(day))
        entry.daydiff = entry.start.diff(start, 'days')
        entry.day = entry.start.format('MM-DD-YYYY');
        entry.uid = user.uid
    })

    console.groupCollapsed('Toggl data')
    console.log(entries)
    console.groupEnd()

    database.updateDatabase([start,end],entries)

    return entries
}