/* eslint-env browser */
import { Component, html, useState } from 'uland'
import {
  TOKEN_DATA,
  UPDATE_IN_PROGRESS
} from '../lib/keys.js'
import { getDeviceCode, pollDeviceCode } from '../lib/device-flow-auth.js'
import { useTokenData } from '../hooks/use-token-data.js'
import { useLocalData } from '../hooks/use-browser-storage.js'

export const Auth = Component(() => {
  const [authSession, setAuthSession] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { tokenData } = useTokenData()
  const {
    updateInProgress
  } = useLocalData({
    updateInProgress: UPDATE_IN_PROGRESS
  })

  async function handleLogOut (ev) {
    if (ev) ev.preventDefault()
    console.log('logging out')
    await browser.storage.sync.remove(TOKEN_DATA)
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
              <input disabled="${updateInProgress ? '' : null}" type="submit" value="Log out">
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
