import { render, Component, html } from 'uland'
import get from 'lodash.get'

import { useTokenData } from '../hooks/use-token-data.js'
import { Stats } from '../options/stats.js'
import { useUnfollowers } from '../hooks/use-unfollowers.js'

export const Popup = Component(() => {
  const { tokenData, loading: tokenDataLoading } = useTokenData()
  const { unfollowers, loading: unfollowersLoading } = useUnfollowers(tokenData)
  async function handleUnfollowerOpen (ev) {
    ev.preventDefault()

    const createData = { url: '/unfollowers/unfollowers.html' }
    await browser.tabs.create(createData)
  }

  async function handleOpenOptions (ev) {
    ev.preventDefault()
    await browser.runtime.openOptionsPage()
  }

  const loading = (tokenDataLoading || unfollowersLoading)

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
  <div>Unfollowers: ${get(unfollowers, 'length', '—')}</div>
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
