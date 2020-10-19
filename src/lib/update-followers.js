import { Octokit } from '@octokit/rest'
import { getCurrentData } from './get-current-data.js'
import { getOldData } from './get-old-data.js'
import {
  getRelationKey,
  getUserKeyIndexKey,
  getIdIndexKey
} from './keys.js'
import { splitObject } from './split-object.js'

const UPDATE_ALARM = 'periodically-update-followers'
const LAST_UPDATE = 'last-update'
const UPDATE_INTERVAL = 12 // hours
const PERIODIC_UPDATES = true

function getHourOffset (hrs) {
  const dt = new Date()
  return dt.setHours(dt.getHours() + hrs)
}

let updating = false

export async function updateAllFollowers (tokens = []) {
  if (updating === true) return null // Already updating

  // clear any alarms
  const cleared = browser.alarms.clear(UPDATE_ALARM)
  console.log(cleared ? 'update alarm cleared' : 'no update alarm to clear')
  const updateTime = new Date()

  try {
    for (const token of tokens) {
      await updateFollowers(token, updateTime)
    }
  } catch (e) {
    console.error(e)
  } finally {
    updating = false
    await browser.storage.sync.set({ [LAST_UPDATE]: updateTime.toISOString() })
    if (PERIODIC_UPDATES) {
      // Set the next time to update
      browser.alarms.create(UPDATE_ALARM, { when: getHourOffset(UPDATE_INTERVAL) })
    }
  }
}

async function updateFollowers (token, updateTime) {
  const octokit = new Octokit({ auth: token, userAgent: 'GitMutual' })
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
    for (const ii of splitIdIndex) {
      await browser.storage.local.set(ii)
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
