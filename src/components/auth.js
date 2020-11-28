import { Component, html, useState, useRef, useEffect } from 'uland'
import css from 'plain-tag'
import {
  TOKEN_DATA,
  userAgent
} from '../lib/keys.js'
import { Octokit } from '@octokit/rest'

export const Auth = Component(() => {
  const [tokenData, setTokenData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const tokenRef = useRef()

  useEffect(() => {
    const getInitialStats = async () => {
      const {
        [TOKEN_DATA]: tokenData
      } = await browser.storage.sync.get({
        [TOKEN_DATA]: {}
      })

      setTokenData(tokenData)

      browser.storage.onChanged.addListener(storageListener)
    }

    const storageListener = async (changes, areaName) => {
      if (areaName === 'sync' && changes[TOKEN_DATA]) {
        setTokenData(changes[TOKEN_DATA].newValue)
      }
    }

    getInitialStats()

    return () => {
      browser.storage.onChanged.remove(storageListener)
    }
  },
  [])

  async function handleSave (ev) {
    if (ev) ev.preventDefault()
    const newSettings = {}
    console.log(ev.currentTarget)
    return
    try {
      setSubmitting(true)
      const token = tokenRef.current.value

      if (token) {
        const octokit = new Octokit({ auth: token, userAgent })
        const { data: currentUser } = await octokit.users.getAuthenticated()
        const tokenData = {
          token,
          email: currentUser.email,
          login: currentUser.login,
          id: currentUser.id
        }
        newSettings[TOKEN_DATA] = tokenData
      } else {
        newSettings[TOKEN_DATA] = null
      }

      await browser.storage.sync.set(newSettings)
    } catch (e) {
      console.log(e)
    } finally {
      setSubmitting(false)
    }
  }

  return html`
  <form onsubmit="${handleSave}">
    <fieldset disabled=${submitting}>
      <legend>Auth</legend>
      <div>
        <label>API Token:
          <input ref="${tokenRef}" name="token" autoCorrect="off" autoCapitalize="none" type="text" .value=${tokenData.token} >
        </label>
      </div>
      <dl>
        <dt>Token Username</dt>
        <dd id="token-login">
          ${tokenData.token}
        </dd>
        <dt>Token ID</dt>
        <dd id="token-id">
          ${tokenData.id}
        </dd>
      </dl>
    </fieldset>
    <input type="submit" value="save">
  </form>
  `
})

// Append style
const style = css`

`
document.head.appendChild(document.createElement('style')).textContent(style)
