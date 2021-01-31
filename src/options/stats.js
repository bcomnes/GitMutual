import { Component, html } from 'uland'
import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_IN_PROGRESS,
  LAST_UPDATE,
  NEXT_UPDATE,
  LAST_UPDATE_ERROR,
  TOKEN_DATA
} from '../lib/keys.js'
import { useBrowserData } from '../hooks/use-browser-storage.js'

export const Stats = Component(() => {
  const {
    lastUpdate,
    lastUpdateError,
    updateInProgress,
    nextUpdate
  } = useBrowserData('local', {
    lastUpdate: LAST_UPDATE,
    lastUpdateError: {
      key: LAST_UPDATE_ERROR,
      default: { message: '', timestamp: null }
    },
    updateInProgress: UPDATE_IN_PROGRESS,
    nextUpdate: NEXT_UPDATE
  })

  const { automaticDataUpdate, tokenData } = useBrowserData('sync', {
    automaticDataUpdate: {
      key: AUTOMATIC_DATA_UPDATE,
      default: true
    },
    tokenData: TOKEN_DATA
  })

  function handleUpdate (ev) {
    ev.preventDefault()
    browser.runtime.sendMessage({ updateData: true })
  }

  return html`
  <div>
    <dl>
      <dt>Last Update</dt>
      <dd>
          <span id="last-update">
            ${updateInProgress
              ? 'In progress...'
              : lastUpdate
                ? new Date(lastUpdate).toLocaleString()
                : 'loading...'
            }
          </span>
          <span id="last-update-error">
            ${updateInProgress
              ? ''
              : lastUpdateError.message
                ? ` (Error: ${lastUpdateError.message} on ${(new Date(lastUpdateError.timestamp)).toLocaleString()})`
                : ''
            }
          </span>
      </dd>
      <dt>Next Update</dt>
      <dd id="next-update">
        ${updateInProgress
            ? 'In progress...'
            : (!automaticDataUpdate || !tokenData)
              ? 'Not scheduled.'
              : nextUpdate
                ? new Date(nextUpdate).toLocaleString()
                : 'loading...'
          }
      </dd>
    </dl>
    <button onclick=${handleUpdate} disabled=${(updateInProgress || !tokenData) ? '' : null}>Update Now</button>
  </div>
  `
})
