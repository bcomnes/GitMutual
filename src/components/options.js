import { Component, html, useState, useRef, useEffect } from 'uland'
import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  TOKEN_DATA,
  UPDATE_IN_PROGRESS,
  LAST_UPDATE,
  NEXT_UPDATE,
  LAST_UPDATE_ERROR,
  UPDATE_ALARM,
  userAgent
} from './lib/keys.js'

export const Options = Component(() => {
  const [automaticDataUpdate, setAutomaticDataUpdate] = useState({})
  const [updateInterval, setUpdateInterval] = useState(12)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getInitialState () {
      const {
        [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate,
        [UPDATE_INTERVAL]: updateInterval
      } = await browser.storage.sync.get({
        [AUTOMATIC_DATA_UPDATE]: true,
        [UPDATE_INTERVAL]: 12
      })

      setAutomaticDataUpdate(automaticDataUpdate)
      setUpdateInterval(updateInterval)

      browser.storage.onChanged.addListener(storageListener)
    }

    async function storageListener (changes, areaName) {
      if (areaName === 'sync' && changes[UPDATE_INTERVAL]) {
        setUpdateInterval(changes[UPDATE_INTERVAL].newValue)
      }

      if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
        setUpdateInterval(changes[AUTOMATIC_DATA_UPDATE].newValue)
      }
    }

    getInitialState()

    return () => {
      browser.storage.onChanged.remove(storageListener)
    }
  })

  function handleSave (ev) {
    ev.preventDefault()
    console.log(ev.currentTarget)
  }

  return html`
  <form onsubmit="${handleSave}">
    <fieldset disabled="${submitting}">
      <legend>Data Updates:</legend>
      <div>
        <label>Automatic Data Updates:
          <input name="automaticDataUpdate" type="checkbox" .value="${automaticDataUpdate}">
        </label>
      </div>
      <div>
        <label>Update interval (in hours):
          <input name="updateInterval" type="number" min="0" step="1" .value="${updateInterval}">
        </label>
      </div>
    </fieldset>
    <input type="submit" value="Save">
  </form>
  `
})
