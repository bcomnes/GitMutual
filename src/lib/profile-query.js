import {
  getLoginIndexKey,
  getRelationKey,
  LAST_LOGIN
} from './keys.js'

export async function profileQuery (userLogin, targetLogin) {
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
}

export async function userListQuery (loginList, targetLogin) {
  const targetLoginKey = getLoginIndexKey(targetLogin)
  const userLoginKeyList = loginList.map(login => getLoginIndexKey(login))

  const { [targetLoginKey]: targetId } = await browser.storage.local.get(targetLoginKey)
  const idMap = await browser.storage.local.get(userLoginKeyList)

  const relationshipKeyList = Object.values(idMap).filter(id => !!id).map(userId => getRelationKey(targetId, userId))

  const relationshipList = await browser.storage.local.get(relationshipKeyList)
  await browser.storage.local.set({ [LAST_LOGIN]: targetLogin })
  return Object.values(relationshipList)
}
