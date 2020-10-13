import browser from 'webextension-polyfill'

import { Octokit } from '@octokit/rest'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'

import devKey from './devKey.js'

const MyOctokit = Octokit.plugin(throttling, retry)

const octokit = new MyOctokit({
  auth: devKey,
  userAgent: 'GitMutual',
  throttle: {
    onRateLimit: (retryAfter, options) => {
      octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
      )

      // Retry twice after hitting a rate limit error, then give up
      if (options.request.retryCount <= 2) {
        console.log(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onAbuseLimit: (retryAfter, options) => {
      // Retry twice after hitting a rate limit error, then give up
      if (options.request.retryCount <= 2) {
        console.log(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    }
  },
  retry: {
    doNotRetry: [400, 401, 403, 404, 422, 429]
  }
})

console.log(octokit)

browser.runtime.onMessage.addListener((request, sender) => {
  console.log('Received request: ', request)
})

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.profileQuery) {
    const { username, target_user } = request.profileQuery /* eslint-disable-line camelcase */

    return octokit.users.checkFollowingForUser({
      username,
      target_user
    }).then(result => {
      return { username, target_user, following: result.status === 204 }
    }).catch(console.warn)
  }
})

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.userListQuery) {
    const { userList, target_user } = request.userListQuery /* eslint-disable-line camelcase */
    return (async () => {
      const followResults = {}
      for await (const result of checkFollowStatus(userList, target_user)) {
        followResults[result.username] = result
      }
      console.log(followResults)
      return followResults
    })().catch(console.warn)
  }
})

async function * checkFollowStatus (userList, target_user) { /* eslint-disable-line camelcase */
  for (const username of userList) {
    try {
      const result = await octokit.users.checkFollowingForUser({ username, target_user })
      yield { username, target_user, following: result.status === 204 }
    } catch (e) {
      if (e.status === 404) yield { username, target_user, following: false }
      else console.log(e)
    }
  }
}
