import { get } from '../scripts/toggl';
import { user } from '../scripts/database';
import { error } from '../pages';

const sels = ['#settings-togglToken', '#settings-workspace', '#settings-save', '.flash-error'];

export default function () {
    let [$toggltoken, $workspace, $save, $error] = sels.map(s => document.querySelector(s));
    // Already has their toggltoken set
    if (user.toggltoken) {
        $toggltoken.value = user.toggltoken;
        get(`/api/v8/workspaces`).then(workspaces => {
            // remove old option
            while ($workspace.hasChildNodes()) {
                $workspace.removeChild($workspace.lastChild);
            }
            // add new children
            workspaces.forEach(workspace => {
                var option = document.createElement('option');
                option.value = workspace.id;
                option.innerText = workspace.name;
                $workspace.appendChild(option);
            });
            // select one
            if (user.workspace) {
                $workspace.querySelector(`[value="${user.workspace}"]`).selected = true;
            } else {
                $workspace.firstChild.selected = true;
            }
        });
    }
    $save.addEventListener('click', () => {
        // test the token
        get('/api/v9/me', $toggltoken.value)
            // token worked, now for the workspace
            .then(() => {
                let $selected = $workspace.options[$workspace.selectedIndex];
                if ($selected) {
                    return $selected.value;
                } else {
                    return get(`/api/v8/workspaces`, $toggltoken.value)
                        .then(workspaces => workspaces[0].id);
                }
            })
            // send update to the database
            .then(workspace => {
                firebase.database().ref('users/' + user.uid).update({
                    '/toggltoken': $toggltoken.value,
                    '/workspace': workspace
                });
            })
            // Everything worked
            .then(() => {
                // hide any errors that came up
                $error.classList.add('d-none');
            })
            .catch(e => {
                $error.classList.remove('d-none');
                $error.innerText = 'Something went wrong, Please check your Toggl Api Token';
                console.error('update to database failed');
                throw e;
            });
    });
}