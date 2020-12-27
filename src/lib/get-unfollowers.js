import {
  getUserKeyIndexKey,
  getIdIndexKey
} from './keys.js'

export async function getUnfollowers (loginId) {
  const userKeyIndexKey = getUserKeyIndexKey(loginId)
  const { [userKeyIndexKey]: lastLoginRelKeys } = await browser.storage.local.get(userKeyIndexKey)
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

  return unfollowers
}
