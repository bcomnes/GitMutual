import { updateAllFollowers } from '../lib/update-followers.js'
import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  UPDATE_IN_PROGRESS,
  UPDATE_ALARM,
  TOKEN_DATA
} from '../lib/keys.js'
import { profileQuery, userListQuery } from '../lib/profile-query.js'
import { getUnfollowers } from '../lib/get-unfollowers.js'
import { handleUpdateIntervalChange, handleAutomaticDataUpdateChange, handleTokenDataChange } from '../lib/handle-settings-change.js'

window.browser = browser
window.update = () => updateAllFollowers()

if (!browser.alarms.onAlarm.hasListener(autoUpdateListener)) {
  console.log('adding alarm listener')
  browser.alarms.onAlarm.addListener(autoUpdateListener)
}

browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  console.log('starting update')
  // reset any bugged in-progress-update state
  await browser.storage.local.set({ [UPDATE_IN_PROGRESS]: false })
  await updateAllFollowers()
  console.log('finished update')
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  /*
    Debug logging
  */
  console.log('Received request: ', message)

  // Safari doesn't like it when you return a data containing promise. Stick with sendResponse

  /*
    Single profile lookup
  */
  if (message.profileQuery) {
    const { userLogin, targetLogin } = message.profileQuery /* eslint-disable-line camelcase */
    profileQuery(userLogin, targetLogin).then(sendResponse)
    return true
  }

  /*
  user list lookup
  */
  if (message.userListQuery) {
    const { loginList, targetLogin } = message.userListQuery /* eslint-disable-line camelcase */
    userListQuery(loginList, targetLogin).then(sendResponse)
    return true
  }

  /*
    Data update request
   */
  if (message.updateData) {
    updateAllFollowers().then(sendResponse)
    return true
  }

  /*
    generate unfollowers list
  */
  if (message.getUnfollowers) {
    const { loginId } = message.getUnfollowers
    getUnfollowers(loginId).then(sendResponse)
    return true
  }
  return false
})

browser.storage.onChanged.addListener(async (changes, areaName) => {
  /*
    update interval settings
  */
  if (areaName === 'sync' && changes[UPDATE_INTERVAL]) {
    const newInterval = changes[UPDATE_INTERVAL].newValue
    await handleUpdateIntervalChange(newInterval)
  }

  /*
    auto update settings
  */
  if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
    const newAutomaticDataUpdateSetting = changes[AUTOMATIC_DATA_UPDATE].newValue
    await handleAutomaticDataUpdateChange(newAutomaticDataUpdateSetting)
  }

  /*
    token data update
  */
  if (areaName === 'sync' && changes[TOKEN_DATA]) {
    const newTokenData = changes[TOKEN_DATA].newValue
    await handleTokenDataChange(newTokenData)
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
