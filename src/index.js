import './assets/primer.css'
import './assets/styleguide.css'
import './assets/style.css';

import fontawesome from "@fortawesome/fontawesome";
import chevronLeft from "@fortawesome/fontawesome-free-solid/faChevronLeft";
import chevronRight from "@fortawesome/fontawesome-free-solid/faChevronRight";
fontawesome.library.add(chevronLeft,chevronRight);

import _nav_ from './templates/nav.ejs'
import _sidebar_ from './templates/sidebar.ejs'
import _chart_ from './templates/chart.ejs'

var body = _nav_({ includeSettingsButton: true });
body += _sidebar_({_chart_:_chart_,data:{}})
document.write(body)
console.log(body)