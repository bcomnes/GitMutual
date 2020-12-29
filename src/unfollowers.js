import { render, Component, html } from 'uland'
import { useTokenData } from './hooks/use-token-data.js'
import { useUnfollowers } from './hooks/use-unfollowers.js'

const Unfollowers = Component(() => {
  const { tokenData } = useTokenData()
  const { unfollowers } = useUnfollowers(tokenData)

  return html`
  <ul>
    ${unfollowers
      ? unfollowers.map(u => html.for(u)`
        <li>
          <a href=${u.data.html_url}>
            <img width="64" src="${u.data.avatar_url}">
            ${u.login} (${u.unfollowedTargetOn.toLocaleString()})
          </a>
        </li>
      `)
      : html`<li>Loading...</li>`}
  </ul>
  `
})

const unfollowersMount = document.querySelector('#unfollowers')
render(unfollowersMount, Unfollowers)
