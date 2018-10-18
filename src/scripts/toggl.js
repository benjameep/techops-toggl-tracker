import * as database from './database'
import { error } from '../pages'
import moment from 'moment'

export function get(path, token = database.user.toggltoken) {
    if (token == undefined) {
        throw new Error('Toggl Api Token was not set')
    }
    return fetch('https://toggl.com' + path, {
        headers: {
            Authorization: 'Basic ' + btoa(token + ':api_token')
        }
    }).then(r => r.json())
}

export async function report([start, end], user, intermid = () => { }) {
    var path = page => `/reports/api/v2/details?user_agent=bananas&workspace_id=${user.workspace}&since=${start.format('YYYY-MM-DD')}&until=${end.format('YYYY-MM-DD')}&page=${page}`
    var page = 1, entries = [], body
    do {
        body = await get(path(page), user.toggltoken)

        body.data.forEach(entry => {
            entry.start = moment(entry.start)
            entry.end = moment(entry.end)
            var day = entry.start.clone().startOf('day')
            entry.time = [entry.start, entry.end].map(d => d.diff(day))
            entry.daydiff = entry.start.diff(start, 'days')
            entry.day = entry.start.format('MM-DD-YYYY')
            entry.uid = user.uid
        })
        entries.push(...body.data)
        intermid(entries)

        page++
    } while (body.data.length >= body.per_page)

    console.groupCollapsed('Toggl data')
    console.log(entries)
    console.groupEnd()

    // Not waiting for the database to be updated
    // caller should just use the data listeners to keep updated
    // (faster load time)
    database.updateDatabase(entries)

    return entries
}