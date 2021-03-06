import * as firebaseui from 'firebaseui';
import '../../node_modules/firebaseui/dist/firebaseui.css';

export default function () {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
        signInSuccessUrl: window.location.href,
        signInOptions: [firebase.auth.GithubAuthProvider.PROVIDER_ID,],
        // Terms of service url.
        tosUrl: '<your-tos-url>',
    });
}
