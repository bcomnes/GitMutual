import { LAST_LOGIN, getLoginIndexKey, getUserKeyIndexKey } from './lib/keys.js'

document.addEventListener('DOMContentLoaded', async () => {
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

  const unfollowerList = document.querySelector('#unfollowers')

  unfollowers.forEach(rel => {
    const root = document.createElement('li')
    const link = document.createElement('a')

    link.innerText = `${rel.login} (${rel.unfollowedTargetOn.toLocaleString()})`
    link.href = `https://github.com/${rel.login}`

    root.appendChild(link)
    unfollowerList.appendChild(root)
  })
})
