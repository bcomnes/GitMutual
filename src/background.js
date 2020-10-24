import browser from 'webextension-polyfill'
import { updateAllFollowers } from './lib/update-followers.js'
import { getLoginIndexKey, getRelationKey } from './lib/keys.js'

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

      return Object.values(relationshipList)
    })().catch(console.error)
  }
})

browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  console.log('starting update')
  await updateAllFollowers()
  console.log('finished update')
})

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.updateData) {
    return (async () => {
      try {
        await updateAllFollowers()
        return true
      } catch (e) {
        return false
      }
    })().catch(console.error)
  }
})
