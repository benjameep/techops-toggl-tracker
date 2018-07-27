import './assets/primer.css'
import './assets/styleguide.css'
import './assets/style.css';

import fontawesome from "@fortawesome/fontawesome";
import faChevronLeft from "@fortawesome/fontawesome-free-solid/faChevronLeft";
import faChevronRight from "@fortawesome/fontawesome-free-solid/faChevronRight";
import faPencilAlt from "@fortawesome/fontawesome-free-solid/faPencilAlt";
import faCodeBranch from "@fortawesome/fontawesome-free-solid/faCodeBranch";
import faTrashAlt from "@fortawesome/fontawesome-free-solid/faTrashAlt";
fontawesome.library.add(faChevronLeft,faChevronRight,faPencilAlt,faCodeBranch,faTrashAlt);

import * as pages from './pages'

pages.timetracking()

window.addEventListener('hashchange',() => {
  try {
    pages[(location.hash||'#timetracking').slice(1)]()
  } catch(e) {
    console.error('404:',location.hash)
  }
})