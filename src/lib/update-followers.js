import { Octokit } from '@octokit/rest'
import { getCurrentData } from './get-current-data.js'
import { getOldData } from './get-old-data.js'
import {
  userAgent,
  getRelationKey,
  getUserKeyIndexKey,
  getIdIndexKey,
  LAST_UPDATE,
  NEXT_UPDATE,
  UPDATE_IN_PROGRESS,
  LAST_UPDATE_ERROR,
  TOKEN_DATA,
  UPDATE_ALARM,
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  BACKUP_GIST_DESCRIPTION,
  BACKUP_GIST_DATA_FILE_NAME
} from './keys.js'
import { splitObject } from './split-object.js'
import browser from 'webextension-polyfill'
import { getHourOffset } from './get-hour-offset.js'

export async function updateAllFollowers () {
  const { [UPDATE_IN_PROGRESS]: updateInProgress } = await browser.storage.local.get({ [UPDATE_IN_PROGRESS]: false })
  if (updateInProgress === true) {
    console.log('update skipping: an update is already in progress')
    return
  }

  const { [TOKEN_DATA]: tokenData } = await browser.storage.sync.get(TOKEN_DATA)
  if (!(tokenData && tokenData.token)) {
    console.log('no token found, skipping update')
    return null
  }

  await browser.storage.local.set({ [UPDATE_IN_PROGRESS]: true })
  // clear any alarms
  const cleared = browser.alarms.clear(UPDATE_ALARM)
  console.log(cleared ? 'update alarm cleared' : 'no update alarm to clear')

  const updateTime = new Date()

  try {
    await updateFollowers(tokenData.token, updateTime)
    await browser.storage.local.set({
      [LAST_UPDATE_ERROR]: {
        message: null,
        timestamp: null
      }
    })
    await browser.storage.local.set({ [LAST_UPDATE]: updateTime.toISOString() })
  } catch (e) {
    console.error(e)
    await browser.storage.local.set({
      [LAST_UPDATE_ERROR]: {
        message: e.message,
        timestamp: updateTime.toISOString()
      }
    })
  } finally {
    await browser.storage.local.set({ [UPDATE_IN_PROGRESS]: false })
    const {
      [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate,
      [UPDATE_INTERVAL]: updateInterval,
      [TOKEN_DATA]: tokenData
    } = await browser.storage.sync.get({
      [AUTOMATIC_DATA_UPDATE]: true,
      [UPDATE_INTERVAL]: 12,
      [TOKEN_DATA]: null
    })
    if (automaticDataUpdate && tokenData) {
      const nextUpdate = getHourOffset(updateInterval, updateTime.toISOString())
      // Set the next time to update
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
      console.log(`New alarm set for ${nextUpdate.toLocaleString()}`)
    } else {
      await browser.storage.local.set({ [NEXT_UPDATE]: null })
    }
    try {
      await backupData(tokenData)
    } catch (e) {
      console.error(e)
    }
  }
}

async function updateFollowers (token, updateTime) {
  const octokit = new Octokit({ auth: token, userAgent })
  const { data: currentUser } = await octokit.users.getAuthenticated()
  const { id: targetId } = currentUser
  const [
    {
      currentFollowings,
      currentFollowers,
      loginIndex,
      idIndex
    }, {
      userData,
      prevFollowings,
      prevFollowers
    }
  ] = await Promise.all([
    getCurrentData(octokit, currentUser),
    getOldData(targetId)
  ])

  const newFollowings = difference(currentFollowings, prevFollowings)
  const newUnfollowings = difference(prevFollowings, currentFollowings)

  for (const newFollowingId of newFollowings) {
    let u = userData[getRelationKey(targetId, newFollowingId)]
    if (!u) {
      u = {}
      userData[getRelationKey(targetId, newFollowingId)] = u
    }
    u.following = true
    u.id = newFollowingId
    u.login = idIndex[getIdIndexKey(newFollowingId)].login
  }

  for (const newUnfollowingId of newUnfollowings) {
    let u = userData[getRelationKey(targetId, newUnfollowingId)]
    if (!u) {
      u = {}
      userData[getRelationKey(targetId, newUnfollowingId)] = u
    }
    u.following = false
  }

  const newFollowers = difference(currentFollowers, prevFollowers)
  const newUnfollowers = difference(prevFollowers, currentFollowers)

  for (const newFollowerId of newFollowers) {
    let u = userData[getRelationKey(targetId, newFollowerId)]
    if (!u) {
      u = {}
      userData[getRelationKey(targetId, newFollowerId)] = u
    }
    u.follower = true
    u.unfollower = false
    u.followedTargetOn = updateTime.toISOString()
    u.unfollowedTargetOn = null // all is forgiven
    u.id = newFollowerId
    u.login = idIndex[getIdIndexKey(newFollowerId)].login
  }

  for (const newUnfollowerId of newUnfollowers) {
    let u = userData[getRelationKey(targetId, newUnfollowerId)]
    if (!u) {
      u = {}
      userData[getRelationKey(targetId, newUnfollowerId)] = u
    }
    u.follower = false
    u.unfollower = true
    u.unfollowedTargetOn = updateTime.toISOString()
  }

  for (const ud of splitObject(userData, 50)) {
    try {
      await browser.storage.local.set(ud)
    } catch (e) {
      console.error(e)
    }
  }

  try {
    await browser.storage.local.set({ [getUserKeyIndexKey(targetId)]: Object.keys(userData) })
  } catch (e) {
    console.error(e)
  }

  try {
    const splitLoginIndex = splitObject(loginIndex, 50)
    for (const li of splitLoginIndex) {
      await browser.storage.local.set(li)
    }
  } catch (e) {
    console.error(e)
  }

  try {
    const splitIdIndex = splitObject(idIndex, 50)
    for (const id of splitIdIndex) {
      await browser.storage.local.set(id)
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * difference returnss the difference betwen setA and setB (setA - setB).
 * @param  {Set} setA LHS set
 * @param  {Set} setB RHS set
 * @return {Set}      The difference Set
 */
function difference (setA, setB) {
  const _difference = new Set(setA)
  for (const elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

async function backupData (tokenData) {
  const localData = await browser.storage.local.get()
  const octokit = new Octokit({ auth: tokenData.token, userAgent })
  console.log('Backing up data...')
  await octokit.rest.gists.update({
    gist_id: tokenData.gist,
    description: BACKUP_GIST_DESCRIPTION,
    files: {
      [BACKUP_GIST_DATA_FILE_NAME]: {
        content: JSON.stringify(localData, null, '  ')
      }
    },
    public: false
  })
  console.log('Data backed up.')
}
