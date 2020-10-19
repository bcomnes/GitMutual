import browser from 'webextension-polyfill'

import { getUserKeyIndexKey } from './keys.js'

export async function getOldData (userId) {
  const userKey = getUserKeyIndexKey(userId)
  const results = await browser.storage.local.get({ [userKey]: [] })
  const userKeys = results[userKey]
  const userData = await browser.storage.local.get(userKeys)

  const prevFollowings = new Set()
  const prevFollowers = new Set()

  for (const v of Object.values(userData)) {
    if (v.following) prevFollowings.add(v.id)
    if (v.follower) prevFollowers.add(v.id)
  }

  return {
    userData,
    prevFollowings,
    prevFollowers
  }
}
