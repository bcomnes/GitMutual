/* eslint-env browser */
import { Component, html, useState, useEffect } from 'uland'
import {
  TOKEN_DATA
} from '../lib/keys.js'
import { getDeviceCode, pollDeviceCode } from '../lib/device-flow-auth.js'

export const Auth = Component(() => {
  const [tokenData, setTokenData] = useState(null)
  const [authSession, setAuthSession] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getInitialStats () {
      const {
        [TOKEN_DATA]: tokenData
      } = await browser.storage.sync.get({
        [TOKEN_DATA]: {}
      })

      setTokenData(tokenData)
      browser.storage.onChanged.addListener(storageListener)
    }

    function storageListener (changes, areaName) {
      if (areaName === 'sync' && changes[TOKEN_DATA]) {
        setTokenData(changes[TOKEN_DATA].newValue)
      }
    }

    getInitialStats()

    return () => {
      browser.storage.onChanged.removeListener(storageListener)
    }
  }, [])

  async function handleLogOut (ev) {
    if (ev) ev.preventDefault()
    await browser.storage.sync.set({
      [TOKEN_DATA]: null
    })
  }

  async function handleLogInInit (ev) {
    if (ev) ev.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const deviceCode = await getDeviceCode()
      setAuthSession({
        verificationUri: deviceCode.verification_uri,
        userCode: deviceCode.user_code
      })

      const tokenData = await pollDeviceCode(deviceCode)

      await browser.storage.sync.set({
        [TOKEN_DATA]: tokenData
      })
    } catch (e) {
      console.log(e)
      setError(e)
    } finally {
      setSubmitting(false)
      setAuthSession(null)
    }
  }

  return html`
    <div>
      ${tokenData
        ? html`
          <form onsubmit="${handleLogOut}">
            <fieldset disabled="${submitting ? '' : null}">
              <legend>GitHub Auth</legend>
              <div>GitMutual authorized with GitHub.</div>
              <dl>
                <dt>Token Username</dt>
                <dd>
                  ${tokenData.login}
                </dd>
                <dt>Token ID</dt>
                <dd>
                  ${tokenData.id}
                </dd>
              </dl>
              <input type="submit" value="Log out">
            </fieldset>
          </form>
        `
        : null}

      ${(!tokenData && !authSession)
        ? html`
          <form onsubmit="${handleLogInInit}">
            <fieldset disabled="${submitting ? '' : null}">
              <legend>GitHub Auth</legend>
              <div>GitMutual needs to authoize with GitHub to monitor followig/follower data.</div>
              <input type="submit" value="Log in to GitHub">
            </fieldset>
          </form>
        `
        : null
      }

      ${!tokenData && authSession
        ? html`
          <form>
            <fieldset disabled="${submitting ? '' : null}">
              <legend>GitHub Auth</legend>
              <div>Authorize with Github by opening this URL in a browser:</div>
              <div>
                <a href="${authSession.verificationUri}" target="_blank">
                    ${authSession.verificationUri}
                </a>
              </div>
              <div>and enter the following User Code:</div>
              <div>
                <code>
                  ${authSession.userCode}
                </code>
              </div>
            </fieldset>
          </form>
        `
        : null}

      ${error ? html`<div>${error.message}</div>` : null}
    </div>
  `
})
