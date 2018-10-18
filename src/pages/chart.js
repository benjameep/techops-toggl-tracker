import * as time from '../scripts/time';
import * as toggl from '../scripts/toggl';
import * as database from '../scripts/database';
import * as draw from '../draw/schedule';

const sels = ['.time-button.forwards', '.time-button.backwards', 'button[data-timeunit="week"]', 'button[data-timeunit="month"]', '.chart-title'];
let forward, backward, week, month, title, dropdown;

function setDFC(dist) {
    if (isNaN(dist)) {
        return console.error('Not a Number', dist);
    }
    if (dist == '0') {
        forward.classList.add('disabled');
    } else {
        forward.classList.remove('disabled');
    }
    localStorage.distanceFromCurrent = dist;
}
function getDFC() {
    if (isNaN(localStorage.distanceFromCurrent)) {
        setDFC('0');
        return 0;
    } else {
        return Number(localStorage.distanceFromCurrent);
    }
}

function loadChart() {
    // Set the page title
    title.innerText = time.chartTitle();
    // if not set then true
    var isWeek = (localStorage.timeunit || 'week') == 'week';
    var period = time.getPeriod();

    draw.setTimeFrame(period, isWeek);

    var splash = document.querySelector('.svg-container .blankslate');
    var svg = document.querySelector('.svg-container svg');

    splash.classList.add('d-none');
    svg.classList.remove('d-none');

    // retrieve the data from toggl
    toggl.report(period, database.user, entries => {
        /* callback is called multiple times for each pagination */
        draw.setEntries(entries);
    }).catch(err => {
        console.log('Behold an error: ', err);

        // TODO: display error

        splash.classList.remove('d-none');
        svg.classList.add('d-none');
    });
}

export default function () {
    console.log('I got run!');

    [forward, backward, week, month, title] = sels.map(s => document.querySelector(s));

    setDFC(getDFC());

    draw.initialize(document.querySelector('.svg-container'));
    loadChart();

    backward.addEventListener('click', () => {
        if (backward.classList.contains('disabled')) { return; }
        setDFC(getDFC() + 1);
        loadChart();
    });

    forward.addEventListener('click', () => {
        if (forward.classList.contains('disabled')) { return; }
        setDFC(getDFC() - 1);
        loadChart();
    });

    week.addEventListener('click', () => {
        if ((localStorage.timeunit || 'week') == 'week') { return; }
        setDFC('0');
        localStorage.timeunit = 'week';
        week.classList.add('selected');
        month.classList.remove('selected');
        loadChart();
    });

    month.addEventListener('click', () => {
        if (localStorage.timeunit == 'month') { return; }
        setDFC('0');
        localStorage.timeunit = 'month';
        month.classList.add('selected');
        week.classList.remove('selected');
        loadChart();
    });

    dropdown = document.querySelectorAll('#users-dropdown a');

    //FIXME: Doesn't remember the user between pages
    Array.from(dropdown).forEach(dropdownItem => {
        dropdownItem.addEventListener('click', () => {
            database.user = database.users[dropdownItem.getAttribute('value')];
            document.querySelector('summary').innerHTML = database.user.displayName;
            loadChart();
        });
    });
}