import * as database from '../scripts/database';
import * as time from '../scripts/time';

const sels = ['.time-button.forwards', '.time-button.backwards', 'button[data-timeunit="week"]', 'button[data-timeunit="month"]', '.chart-title'];
let forward, backward, week, month, title, dropdown;

let draw

function setDFC(dist) {
    if (isNaN(dist)) {
        return console.error('Not a Number', dist);
    }
    if (dist == '0') {
        forward.classList.add('disabled');
    } else {
        forward.classList.remove('disabled');
    }
    sessionStorage.distanceFromCurrent = dist;
}
function getDFC() {
    if (isNaN(sessionStorage.distanceFromCurrent)) {
        setDFC('0');
        return 0;
    } else {
        return Number(sessionStorage.distanceFromCurrent);
    }
}

function loadChart(){
    // Set the page title
    title.innerText = time.chartTitle();

    // if not set then true
    var isWeek = (sessionStorage.timeunit || 'week') == 'week';
    var period = time.getPeriod();
  
    draw.setTimeFrame(period, isWeek)
}

export default function (drawfn) {
    [forward, backward, week, month, title] = sels.map(s => document.querySelector(s));

    draw = drawfn

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
        if ((sessionStorage.timeunit || 'week') == 'week') { return; }
        setDFC('0');
        sessionStorage.timeunit = 'week';
        week.classList.add('selected');
        month.classList.remove('selected');
        loadChart();
    });

    month.addEventListener('click', () => {
        if (sessionStorage.timeunit == 'month') { return; }
        setDFC('0');
        sessionStorage.timeunit = 'month';
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