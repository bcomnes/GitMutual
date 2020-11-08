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
import { getHourOffset } from './lib/get-hour-offset.js'
import { Octokit } from '@octokit/rest'

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('reset').addEventListener('click', restoreOptions)
async function restoreOptions (ev) {
  if (ev) ev.preventDefault()

  document.querySelector('#status').innerText = 'Restoring settings...'
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
    [TOKEN_DATA]: tokenData,
    [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate,
    [UPDATE_INTERVAL]: updateInterval
  } = await browser.storage.sync.get({
    [AUTOMATIC_DATA_UPDATE]: true,
    [UPDATE_INTERVAL]: 12,
    [TOKEN_DATA]: null
  })

  updateLastUpdate(lastUpdate, updateInProgress)
  updateErrorMessage(lastUpdateError, updateInProgress)
  updateNextUpdate(nextUpdate, updateInProgress)

  const optionsForm = document.querySelector('#options-form')

  optionsForm.automaticDataUpdate.checked = automaticDataUpdate
  optionsForm.updateInterval.value = updateInterval
  optionsForm.updateInterval.disabled = !automaticDataUpdate
  optionsForm.token.value = tokenData ? tokenData.token : ''

  document.querySelector('#token-login').innerText = tokenData ? tokenData.login : ''
  document.querySelector('#token-id').innerText = tokenData ? tokenData.id : ''
  document.querySelector('#status').innerText = 'Settings restored.'
}

document.getElementById('save').addEventListener('click', saveSettings)
async function saveSettings (ev) {
  if (ev) ev.preventDefault()
  const optionsForm = document.querySelector('#options-form')
  try {
    optionsForm.disabled = true
    document.querySelector('#status').innerText = 'Saving settings...'
    const token = optionsForm.token.value

    const octokit = new Octokit({ auth: token, userAgent })

    document.querySelector('#token-login').innerText = '...'
    document.querySelector('#token-id').innerText = '...'

    const newSettings = {
      [AUTOMATIC_DATA_UPDATE]: optionsForm.automaticDataUpdate.checked,
      [UPDATE_INTERVAL]: JSON.parse(optionsForm.updateInterval.value)
    }

    if (token) {
      let tokenData
      try {
        const { data: currentUser } = await octokit.users.getAuthenticated()
        console.log(currentUser)
        tokenData = {
          token,
          email: currentUser.email,
          login: currentUser.login,
          id: currentUser.id
        }
        document.querySelector('#token-login').innerText = tokenData ? tokenData.login : ''
        document.querySelector('#token-id').innerText = tokenData ? tokenData.id : ''
        optionsForm.token.setCustomValidity('')
      } catch (e) {
        optionsForm.token.setCustomValidity(e.message)
        document.querySelector('#token-login').innerText = e.message
      }

      if (tokenData) {
        newSettings[TOKEN_DATA] = tokenData
      }
    } else {
      newSettings[TOKEN_DATA] = null
      document.querySelector('#token-login').innerText = ''
      document.querySelector('#token-id').innerText = ''
    }

    await browser.storage.sync.set(newSettings)
    document.querySelector('#status').innerText = 'Options saved.'
  } catch (e) {
    console.log(e)
  } finally {
    optionsForm.disabled = false
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#automatic-update-checkbox').addEventListener('change', (ev) => {
    const intervalField = document.querySelector('#update-interval-field')
    if (ev.currentTarget.checked) intervalField.disabled = false
    else intervalField.disabled = true
  })
})

document.getElementById('update').addEventListener('click', triggerUpdate)
async function triggerUpdate () {
  await browser.runtime.sendMessage({ updateData: true })
}

browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes[UPDATE_IN_PROGRESS]) {
    if (changes[UPDATE_IN_PROGRESS].newValue === true) {
      console.log(`Update in progress ${changes[UPDATE_IN_PROGRESS].newValue}`)
      updateLastUpdate(null, true)
      updateErrorMessage()
      document.getElementById('update').disabled = true
    } else {
      document.getElementById('update').disabled = false
    }
    return
  }

  if (areaName === 'local' && changes[LAST_UPDATE]) {
    console.log(`Updated completed on ${changes[LAST_UPDATE].newValue}`)
    updateLastUpdate(changes[LAST_UPDATE].newValue)
    return
  }

  if (areaName === 'local' && changes[NEXT_UPDATE]) {
    if (changes[NEXT_UPDATE].newValue) {
      console.log(`Next update scheduled on ${(new Date(changes[NEXT_UPDATE].newValue)).toLocaleString()}`)
    } else {
      console.log('Future updates cleared')
    }
    updateNextUpdate(changes[NEXT_UPDATE].newValue)
  }

  if (areaName === 'local' && changes[LAST_UPDATE_ERROR]) {
    if (changes[LAST_UPDATE_ERROR].newValue.message) {
      console.log('Update failed')
      updateErrorMessage(changes[LAST_UPDATE_ERROR].newValue)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
      updateLastUpdate(lastUpdate)
    } else {
      updateErrorMessage(changes[LAST_UPDATE_ERROR].newValue)
    }
  }

  if (areaName === 'sync' && changes[UPDATE_INTERVAL]) {
    const { [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate } = await browser.storage.sync.get(AUTOMATIC_DATA_UPDATE)
    if (automaticDataUpdate) {
      browser.alarms.clear(UPDATE_ALARM)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
      console.log(lastUpdate)
      const nextUpdate = getHourOffset(changes[UPDATE_INTERVAL].newValue, lastUpdate)
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
    }
  }

  if (areaName === 'sync' && changes[AUTOMATIC_DATA_UPDATE]) {
    const optionsForm = document.querySelector('#options-form')
    optionsForm.updateInterval.disabled = !changes[AUTOMATIC_DATA_UPDATE].newValue
    if (changes[AUTOMATIC_DATA_UPDATE].newValue === true) {
      browser.alarms.clear(UPDATE_ALARM)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
      const nextUpdate = getHourOffset(changes[AUTOMATIC_DATA_UPDATE].newValue, lastUpdate)
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
    } else {
      browser.alarms.clear(UPDATE_ALARM)
      await browser.storage.local.set({ [NEXT_UPDATE]: null })
    }
  }
})

function updateErrorMessage (errorLog = {}, updateInProgress) {
  const lastUpdateErrorField = document.querySelector('#last-update-error')
  lastUpdateErrorField.innerText = updateInProgress
    ? ''
    : errorLog.message
      ? ` (Error: ${errorLog.message} on ${(new Date(errorLog.timestamp)).toLocaleString()})`
      : ''
}

function updateLastUpdate (lastUpdate, updateInProgress) {
  const lastUpdateErrorField = document.querySelector('#last-update')
  lastUpdateErrorField.innerText = updateInProgress
    ? 'Updating...'
    : lastUpdate
      ? (new Date(lastUpdate)).toLocaleString()
      : 'Never'
}

function updateNextUpdate (nextUpdate, updateInProgress) {
  document.querySelector('#next-update').innerText = updateInProgress
    ? '...'
    : nextUpdate
      ? (new Date(nextUpdate)).toLocaleString()
      : 'Unscheduled'
}
