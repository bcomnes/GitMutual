import browser from 'webextension-polyfill'

import { Octokit } from '@octokit/rest'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'

const MyOctokit = Octokit.plugin(throttling, retry)

const octokit = new MyOctokit({
  // auth: authData.token,
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
    console.log(userList)
    console.log(target_user)
    return Promise.resolve('looking into it')
  }
})
