import { getLoginIndexKey, getIdIndexKey } from './keys.js'

export async function getCurrentData (octokit, currentUser) {
  const followings = await getAll(octokit, octokit.users.listFollowedByAuthenticated)
  const currentFollowings = getSetBy(followings, 'id')

  const followers = await getAll(octokit, octokit.users.listFollowersForAuthenticatedUser)
  const currentFollowers = getSetBy(followers, 'id')

  const loginIndex = takeKey(indexUserLogin(followings, followers, [currentUser]), 'id')
  const idIndex = takeKeys(indexUserId(followings, followers, [currentUser]), 'id', 'login', 'avatar_url', 'html_url')

  return {
    currentFollowings,
    currentFollowers,
    loginIndex,
    idIndex
  }
}

async function getAll (octokit, endpoint) {
  let all = []
  let pages = 0

  for await (const response of octokit.paginate.iterator(
    endpoint, { per_page: 100 })) {
    all = all.concat(response.data)
    console.log(`page ${pages}`)
    pages++
  }
  return all
}

function getSetBy (data, key) {
  return new Set(data.map(i => i[key]))
}

function indexUserLogin (...arrays) {
  const index = {}

  for (const array of arrays) {
    for (const user of array) {
      index[getLoginIndexKey(user.login)] = user
    }
  }

  return index
}

function indexUserId (...arrays) {
  const index = {}

  for (const array of arrays) {
    for (const user of array) {
      index[getIdIndexKey(user.id)] = user
    }
  }

  return index
}

function takeKeys (obj, ...keys) {
  const clone = {}
  for (const [k, v] of Object.entries(obj)) {
    clone[k] = {}

    for (const key of keys) {
      clone[k][key] = v[key]
    }
  }

  return clone
}

function takeKey (obj, key) {
  const clone = {}

  for (const [k, v] of Object.entries(obj)) {
    clone[k] = v[key]
  }

  return clone
}
