import * as time from '../scripts/time'
import * as toggl from '../scripts/toggl'
import * as database from '../scripts/database'
import * as draw from '../draw/schedule'

const sels = ['.time-button.forwards', '.time-button.backwards', 'button[data-timeunit="week"]', 'button[data-timeunit="month"]', '.chart-title']
let forward, backward, week, month, title, dropdown

function setDFC(dist) {
    if (isNaN(dist)) {
        return console.error('Not a Number', dist)
    }
    if (dist == '0') {
        forward.classList.add('disabled')
    } else {
        forward.classList.remove('disabled')
    }
    localStorage.distanceFromCurrent = dist
}
function getDFC() {
    if (isNaN(localStorage.distanceFromCurrent)) {
        setDFC('0')
        return 0
    } else {
        return Number(localStorage.distanceFromCurrent)
    }
}

function loadChart() {
    // Set the page title
    title.innerText = time.chartTitle()
    // if not set then true
    var isWeek = (localStorage.timeunit || 'week') == 'week'
    var period = time.getPeriod()

    draw.setTimeFrame(period, isWeek)

    // retrieve the data from toggl
    // TODO: change which user it is getting based on dropdown
    toggl.report(period, database.user, entries => {
        /* callback is called multiple times for each pagination */
        draw.setEntries(entries)
    })
}

export default function () {

    [forward, backward, week, month, title] = sels.map(s => document.querySelector(s))

    setDFC(getDFC())

    draw.initialize(document.querySelector('.svg-container'))
    loadChart()

    backward.addEventListener('click', () => {
        if (backward.classList.contains('disabled')) { return }
        setDFC(getDFC() + 1)
        loadChart()
    })

    forward.addEventListener('click', () => {
        if (forward.classList.contains('disabled')) { return }
        setDFC(getDFC() - 1)
        loadChart()
    })

    week.addEventListener('click', () => {
        if ((localStorage.timeunit || 'week') == 'week') { return }
        setDFC('0')
        localStorage.timeunit = 'week'
        week.classList.add('selected')
        month.classList.remove('selected')
        loadChart()
    })

    month.addEventListener('click', () => {
        if (localStorage.timeunit == 'month') { return }
        setDFC('0')
        localStorage.timeunit = 'month'
        month.classList.add('selected')
        week.classList.remove('selected')
        loadChart()
    })

    dropdown = document.querySelectorAll('#users-dropdown a')

    // TODO: Add listener to change user dropdown
    Array.from(dropdown).forEach(dropdownItem => {
        dropdownItem.addEventListener('click', () => {
            var period = time.getPeriod()
            toggl.report(period, database.users[dropdownItem.getAttribute('value')], entries => {

                /* callback is called multiple times for each pagination */
                draw.setEntries(entries)
            })
        })

    })
}