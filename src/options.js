import { render, html } from 'uland'

import { Stats } from './options/stats.js'
import { Auth } from './options/auth.js'
import { Settings } from './options/settings.js'

render(document.querySelector('.gm-options-page'), () => html`
  <h2>Stats</h2>
  <div class="gm-options-stats">
    ${Stats()}
  </div>

  <h2>Options</h2>

  <div class="gm-options-auth">
    ${Auth()}
  </div>

  <div class="gm-options-settings">
    ${Settings()}
  </div>
`)
