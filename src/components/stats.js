import { Component, html, useState, useEffect } from 'uland'
import css from 'plain-tag'
import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_IN_PROGRESS,
  LAST_UPDATE,
  NEXT_UPDATE,
  LAST_UPDATE_ERROR
} from '../lib/keys.js'

export const Stats = Component(() => {
  const [lastUpdate, setLastUpdate] = useState(null)
  const [lastUpdateError, setLastUpdateError] = useState({ message: '', timestamp: null })
  const [updateInProgress, setUpdateInProgress] = useState(null)
  const [nextUpdate, setNextUpdate] = useState(null)
  const [automaticDataUpdate, setAutomaticDataUpdate] = useState(null)

  useEffect(() => {
    const getInitialStats = async () => {
      const {
        [LAST_UPDATE]: lastUpdate,
        [NEXT_UPDATE]: nextUpdate,
        [UPDATE_IN_PROGRESS]: updateInProgress,
        [LAST_UPDATE_ERROR]: lastUpdateError
      } = await browser.storage.local.get({
        [LAST_UPDATE]: null,
        [NEXT_UPDATE]: null,
        [UPDATE_IN_PROGRESS]: false,
        [LAST_UPDATE_ERROR]: {
          message: '',
          timestamp: null
        }
      })

      const {
        [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate
      } = await browser.storage.sync.get({
        [AUTOMATIC_DATA_UPDATE]: true
      })

      setLastUpdate(lastUpdate)
      setNextUpdate(nextUpdate)
      setUpdateInProgress(updateInProgress)
      setLastUpdateError(lastUpdateError)
      setAutomaticDataUpdate(automaticDataUpdate)

      browser.storage.onChanged.addListener(storageListener)
    }

    const storageListener = async (changes, areaName) => {
      if (areaName === 'local' && changes[UPDATE_IN_PROGRESS]) {
        setUpdateInProgress(changes[UPDATE_IN_PROGRESS].newValue)
      }

      if (areaName === 'local' && changes[LAST_UPDATE]) {
        setLastUpdate(changes[LAST_UPDATE].newValue)
      }

      if (areaName === 'local' && changes[NEXT_UPDATE]) {
        setNextUpdate(changes[NEXT_UPDATE].newValue)
      }

      if (areaName === 'local' && changes[LAST_UPDATE_ERROR]) {
        setLastUpdateError(changes[LAST_UPDATE_ERROR].newValue)
      }

      if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
        setAutomaticDataUpdate(changes[AUTOMATIC_DATA_UPDATE].newValue)
      }
    }

    getInitialStats()

    return () => {
      browser.storage.onChanged.remove(storageListener)
    }
  },
  [])

  return html`
  <div class="options">
    <h2>Stats</h2>
    <dl>
      <dt>Last Update</dt>
      <dd>
          <span id="last-update">
            ${updateInProgress
              ? 'In progress...'
              : lastUpdate
                ? lastUpdate.toLocalString()
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
            : !automaticDataUpdate
              ? 'Not scheduled.'
              : nextUpdate
                ? nextUpdate.toLocalString()
                : 'loading...'
          }
      </dd>
    </dl>
  </div>
  `
})

// Append style
const style = css`

`
document.head.appendChild(document.createElement('style')).textContent(style)
