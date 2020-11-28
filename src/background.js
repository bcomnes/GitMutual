import { updateAllFollowers } from './lib/update-followers.js'
import {
  getLoginIndexKey,
  getRelationKey,
  LAST_LOGIN,
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  UPDATE_IN_PROGRESS,
  LAST_UPDATE,
  NEXT_UPDATE,
  UPDATE_ALARM,
  TOKEN_DATA
} from './lib/keys.js'
import { getHourOffset } from './lib/get-hour-offset.js'

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

browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes[UPDATE_INTERVAL]) {
    const { [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate } = await browser.storage.sync.get(AUTOMATIC_DATA_UPDATE)
    if (automaticDataUpdate) {
      browser.alarms.clear(UPDATE_ALARM)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
      const nextUpdate = getHourOffset(changes[UPDATE_INTERVAL].newValue, lastUpdate)
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
    }
  }

  if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
    if (changes[AUTOMATIC_DATA_UPDATE].newValue === true) {
      browser.alarms.clear(UPDATE_ALARM)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
      const { [UPDATE_INTERVAL]: updateInterval } = await browser.storage.sync.get(UPDATE_INTERVAL)
      const nextUpdate = getHourOffset(updateInterval, lastUpdate)
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
    } else {
      browser.alarms.clear(UPDATE_ALARM)
      await browser.storage.local.set({ [NEXT_UPDATE]: null })
    }
  }

  if (areaName === 'sync' && changes[TOKEN_DATA]) {
    const { [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate, [UPDATE_INTERVAL]: updateInterval } = await browser.storage.sync.get([AUTOMATIC_DATA_UPDATE, UPDATE_INTERVAL])
    if (automaticDataUpdate) {
      if (changes[TOKEN_DATA].newValue) {
        browser.alarms.clear(UPDATE_ALARM)
        const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get([LAST_UPDATE, UPDATE_INTERVAL])
        const nextUpdate = getHourOffset(updateInterval, lastUpdate)
        browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
        await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
      } else {
        browser.alarms.clear(UPDATE_ALARM)
        await browser.storage.local.set({ [NEXT_UPDATE]: null })
      }
    }
  }
})
