import { updateAllFollowers } from './lib/update-followers.js'
import { getLoginIndexKey, getRelationKey, LAST_LOGIN, UPDATE_IN_PROGRESS, UPDATE_ALARM } from './lib/keys.js'

window.browser = browser

window.update = () => updateAllFollowers()

/*
  Debug logging
*/
browser.runtime.onMessage.addListener((request, sender) => {
  console.log('Received request: ', request)
})

/*
  Single profile lookup
*/
browser.runtime.onMessage.addListener((request, sender) => {
  if (request.profileQuery) {
    return (async () => {
      const { userLogin, targetLogin } = request.profileQuery /* eslint-disable-line camelcase */

      const targetLoginKey = getLoginIndexKey(targetLogin)
      const userLoginKey = getLoginIndexKey(userLogin)

      const { [targetLoginKey]: targetId, [userLoginKey]: userId } = await browser.storage.local.get([
        userLoginKey,
        targetLoginKey
      ])

      const relationhipKey = getRelationKey(targetId, userId)

      const { [relationhipKey]: relationship } = await browser.storage.local.get(getRelationKey(targetId, userId))
      await browser.storage.local.set({ [LAST_LOGIN]: targetLogin })
      return { login: userLogin, ...relationship }
    })().catch(console.error)
  }
})

/*
  user list lookup
*/
browser.runtime.onMessage.addListener((request, sender) => {
  if (request.userListQuery) {
    return (async () => {
      const { loginList, targetLogin } = request.userListQuery /* eslint-disable-line camelcase */

      const targetLoginKey = getLoginIndexKey(targetLogin)
      const userLoginKeyList = loginList.map(login => getLoginIndexKey(login))

      const { [targetLoginKey]: targetId } = await browser.storage.local.get(targetLoginKey)
      const idMap = await browser.storage.local.get(userLoginKeyList)

      const relationshipKeyList = Object.values(idMap).filter(id => !!id).map(userId => getRelationKey(targetId, userId))

      const relationshipList = await browser.storage.local.get(relationshipKeyList)
      await browser.storage.local.set({ [LAST_LOGIN]: targetLogin })
      return Object.values(relationshipList)
    })().catch(console.error)
  }
})

browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  console.log('starting update')
  // reset any bugged in-progress-update state
  await browser.storage.local.set({ [UPDATE_IN_PROGRESS]: false })
  await updateAllFollowers()
  console.log('finished update')
})

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.updateData) {
    return (async () => {
      await updateAllFollowers()
    })().catch(console.error)
  }
})

async function autoUpdateListener (alarm) {
  if (alarm.name === UPDATE_ALARM) {
    try {
      console.log('scheduled auto update triggered update')
      await updateAllFollowers()
    } catch (e) {
      console.error(e)
    }
  }
}

if (!browser.alarms.onAlarm.hasListener(autoUpdateListener)) {
  console.log('adding alarm listener')
  browser.alarms.onAlarm.addListener(autoUpdateListener)
}
