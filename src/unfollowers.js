import { render, Component, html, useState, useEffect } from 'uland'
import { LAST_LOGIN, getLoginIndexKey, getUserKeyIndexKey, getIdIndexKey } from './lib/keys.js'

const Unfollowers = Component(() => {
  const [unfollowers, setUnfollowers] = useState(null)

  useEffect(() => {
    async function getInitialData () {
      const { [LAST_LOGIN]: lastLogin } = await browser.storage.local.get(LAST_LOGIN)
      const lastLoginLoginKey = getLoginIndexKey(lastLogin)
      const { [lastLoginLoginKey]: lastLoginId } = await browser.storage.local.get(lastLoginLoginKey)
      const lastLoginUserKeyIndexKey = getUserKeyIndexKey(lastLoginId)
      const { [lastLoginUserKeyIndexKey]: lastLoginRelKeys } = await browser.storage.local.get(lastLoginUserKeyIndexKey)
      const relData = await browser.storage.local.get(lastLoginRelKeys)

      const unfollowers = Object.values(relData)
        .filter(rel => rel.unfollower === true)
        .map(rel => { rel.unfollowedTargetOn = new Date(rel.unfollowedTargetOn); return rel })
        .sort((a, b) => b.unfollowedTargetOn - a.unfollowedTargetOn)

      const unfollowerDataKeys = unfollowers.map(u => getIdIndexKey(u.id))
      const unfollowerData = await browser.storage.local.get(unfollowerDataKeys)

      unfollowers.forEach(u => {
        u.data = unfollowerData[getIdIndexKey(u.id)]
      })

      setUnfollowers(unfollowers)
    }

    getInitialData()
  }, [])

  return html`
  <ul>
    ${unfollowers
      ? unfollowers.map(u => { console.log(u); return u }).map(u => html.for(u)`
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
