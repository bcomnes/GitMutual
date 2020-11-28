/* eslint-env browser */
import { Octokit } from '@octokit/rest'
import { clientId, userAgent } from './keys.js'

const defaultRequestOpts = {
  headers: {
    'User-Agent': userAgent,
    Accept: 'application/json'
  },
  method: 'post'
}

export async function getDeviceCode () {
  const deviceCode = await fetch(`https://github.com/login/device/code?client_id=${clientId}`, defaultRequestOpts).then(req => req.json())
  if (deviceCode.error) {
    let error
    switch (deviceCode.error) {
      case 'Not Found': {
        error = new Error('Not found: is the clientId correct?')
        break
      }
      case 'unauthorized_client': {
        error = new Error(`${deviceCode.error_description} Did you enable 'Device authorization flow' for your oAuth application?`)
        break
      }
      default: {
        error = new Error(deviceCode.error_description || deviceCode.error)
        break
      }
    }
    error.data = deviceCode
    throw error
  }

  if (!(deviceCode.device_code || deviceCode.user_code)) {
    const error = new Error('No device code from GitHub!')
    error.data = deviceCode
    throw error
  }

  return deviceCode
}

/* eslint-disable-next-line camelcase */
export async function pollDeviceCode ({ interval, verification_uri, device_code, user_code }, { signal } = {}) {
  let abortDetected = false
  let abort = abortDetected
  if (signal) {
    signal.addEventListener('abort', () => {
      abort = true
    })
  }

  while (!abortDetected) {
    await sleep(interval)
    const data = await requestAcessToken(device_code)

    if (data.access_token) { return supplementUserData(data) }
    if (data.error === 'authorization_pending') continue
    if (data.error === 'slow_down') interval = data.interval
    if (data.error === 'expired_token') {
      const err = new Error(data.error_description || 'Token expired')
      err.code = 'expired_token'
      throw err
    }
    if (data.error === 'unsupported_grant_type') throw new Error(data.error_description || 'Incorrect grant type.')
    if (data.error === 'incorrect_client_credentials') throw new Error(data.error_description || 'Incorrect clientId.')
    if (data.error === 'incorrect_device_code') throw new Error(data.error_description || 'Incorrect device code.')
    abortDetected = abort
  }
}

function requestAcessToken (deviceToken) {
  const accessTokenUrl = new URL('https://github.com/login/oauth/access_token')
  accessTokenUrl.searchParams.set('client_id', clientId)
  accessTokenUrl.searchParams.set('device_code', deviceToken)
  accessTokenUrl.searchParams.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code')

  return fetch(accessTokenUrl, defaultRequestOpts).then(req => req.json())
}

async function supplementUserData (tokenData) {
  // Get user login info
  const token = tokenData.access_token
  const octokit = new Octokit({ auth: token, userAgent })
  const { data: currentUser } = await octokit.users.getAuthenticated()

  return {
    token,
    email: currentUser.email,
    login: currentUser.login,
    id: currentUser.id
  }
}

function sleep (s) {
  const ms = s * 1000
  return new Promise(resolve => setTimeout(resolve, ms))
}
