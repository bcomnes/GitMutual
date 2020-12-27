import { Component, html, useState, useEffect } from 'uland'
import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL
} from '../lib/keys.js'

export const Settings = Component(() => {
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

    function storageListener (changes, areaName) {
      if (areaName === 'sync' && changes[UPDATE_INTERVAL]) {
        setUpdateInterval(changes[UPDATE_INTERVAL].newValue)
      }

      if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
        setAutomaticDataUpdate(changes[AUTOMATIC_DATA_UPDATE].newValue)
      }
    }

    getInitialState()

    return () => {
      browser.storage.onChanged.removeListener(storageListener)
    }
  }, [])

  async function handleSave (ev) {
    ev.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const newSettings = {
        [UPDATE_INTERVAL]: ev.currentTarget.updateInterval.valueAsNumber,
        [AUTOMATIC_DATA_UPDATE]: ev.currentTarget.automaticDataUpdate.checked
      }

      await browser.storage.sync.set(newSettings)
    } catch (e) {
      console.error(e)
      setError(e)
    } finally {
      setSubmitting(false)
    }
  }

  return html`
  <form onsubmit="${handleSave}">
    <fieldset disabled="${submitting ? '' : null}">
      <legend>Update schedule:</legend>
      <div>
        <label>Automatic Data Updates:
          <input name="automaticDataUpdate" type="checkbox" checked=${automaticDataUpdate ? '' : null}>
        </label>
      </div>
      <div>
        <label>Update interval (in hours):
          <input name="updateInterval" type="number" min="0" step="1" value=${updateInterval}>
        </label>
      </div>
      <input
        type="submit"
        value="${submitting ? 'Saving...' : 'Save'}"
        style="margin-top: 1em;"
      >
      <div>${error ? error.message : null}</div>
    </fieldset>
  </form>
  `
})
