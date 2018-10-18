import _nav_ from './templates/nav.ejs';
import _sidebar_ from './templates/sidebar.ejs';
import _error_ from './templates/error.ejs';
import _chart_ from './pages/chart.ejs';
import _settings_ from './pages/settings.ejs';
import _projects_ from './pages/projects.ejs';

import chartEventHandlers from './pages/chart';
import projectsEventHandlers from './pages/projects';
import settingsEventHandlers from './pages/settings';
import loginEventHandlers from './pages/login';

import * as database from './scripts/database';

let loaded = false;
let onload;
window.addEventListener('load', () => {
    loaded = true;
    onload && onload();
});

export function timetracking(data) {
    if (!loaded) { return onload = () => timetracking(data); }
    var html = _nav_({ includeSettingsButton: true });
    html += _sidebar_({
        page: 'timetracking',
        _main_: _chart_,
        data: Object.assign({ isPersonal: true, database: database }, data)
    });
    document.body.innerHTML = html;
    chartEventHandlers();
}

export function team(data) {
    if (!loaded) { return onload = () => team(data); }
    var html = _nav_({ includeSettingsButton: true });
    html += _sidebar_({
        page: 'team',
        _main_: _chart_,
        data: Object.assign({ isPersonal: false }, data)
    });
    document.body.innerHTML = html;
    chartEventHandlers();
}

export function settings(data) {
    if (!loaded) { return onload = () => settings(data); }
    var html = _nav_({ includeSettingsButton: false });
    html += _settings_(data);
    document.body.innerHTML = html;
    settingsEventHandlers();
}

export function projects(data) {
    if (!loaded) { return onload = () => projects(data); }
    var html = _nav_({ includeSettingsButton: true });
    html += _sidebar_({
        page: 'projects',
        _main_: _projects_,
        data: data
    });
    document.body.innerHTML = html;
    projectsEventHandlers();
}

export function login() {
    if (!loaded) { return onload = () => login(); }
    var html = _nav_({ includeSettingsButton: false });
    html += '<div class="pt-6" id="firebaseui-auth-container"></div>';
    document.body.innerHTML = html;
    loginEventHandlers();
}

export function error(err) {
    if (!loaded) { return onload = () => error(err); }
    var html = _nav_({ includeSettingsButton: false });
    html += _error_(err);
    document.body.innerHTML = html;
}