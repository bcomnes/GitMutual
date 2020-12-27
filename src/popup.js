import { render, Component, html } from 'uland'
import { useTokenData } from './hooks/use-token-data.js'
import { Stats } from './options/stats.js'
// import get from 'lodash.get'

export const Popup = Component(() => {
  const { tokenData, loading } = useTokenData()
  async function handleUnfollowerOpen (ev) {
    ev.preventDefault()

    const createData = { url: 'unfollowers.html' }
    await browser.tabs.create(createData)
    console.log('unfollowers.html opened')
  }

  async function handleOpenOptions (ev) {
    ev.preventDefault()
    await browser.runtime.openOptionsPage()
    console.log('options opened')
  }

  if (loading) return html`<div>Loading...</div>`

  if (!tokenData) {
    return html`
    <div>
      <button onclick=${handleOpenOptions}>
        Login to GitHub
      </button>
    </div>`
  }

  return html`
  <div>Logged in as: ${tokenData.login}</div>
  ${Stats()}
  <button onclick=${handleUnfollowerOpen}>
    Unfollowers
  </button>
  <button onclick=${handleOpenOptions}>
    Options
  </button>
`
})

const popupMount = document.querySelector('#popup-component')
render(popupMount, () => html`
  <div>
    ${Popup()}
  </div>
`)
