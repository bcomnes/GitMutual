import { render, Component, html } from 'uland'

async function handleUnfollowerOpen (ev) {
  ev.preventDefault()

  const createData = { url: 'unfollowers.html' }
  await browser.tabs.create(createData)
  console.log('unfollowers.html opened')
}

export const Popup = Component(() => {
  return html`
  <button onclick=${handleUnfollowerOpen}>
    Unfollowers
  </button>
`
})

const popupMount = document.querySelector('#popup-component')
render(popupMount, () => html`
  <div>
    ${Popup()}
  </div>
`)
