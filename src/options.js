import browser from 'webextension-polyfill'
import {
  LAST_UPDATE,
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  TOKEN_DATA
} from './lib/keys.js'

async function restoreOptions () {
  document.querySelector('#status').innerText = 'Restoring settings...'
  const {
    [LAST_UPDATE]: lastUpdate
  } = await browser.storage.local.get({ [LAST_UPDATE]: null })

  const opts = await browser.storage.sync.get({
    [AUTOMATIC_DATA_UPDATE]: true,
    [UPDATE_INTERVAL]: 12,
    [TOKEN_DATA]: null
  })

  const {
    [TOKEN_DATA]: tokenData,
    [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate,
    [UPDATE_INTERVAL]: updateInterval
  } = opts

  const lastUpdateField = document.querySelector('#last-update')
  lastUpdateField.innerText = lastUpdate ? new Date(lastUpdate).toLocaleString() : 'never'

  const optionsForm = document.querySelector('#options-form')

  optionsForm.automaticDataUpdate.checked = automaticDataUpdate
  optionsForm.updateInterval.value = updateInterval
  optionsForm.token.value = tokenData ? tokenData.token : ''

  document.querySelector('#token-login').innerText = tokenData ? tokenData.login : ''
  document.querySelector('#token-email').innerText = tokenData ? tokenData.email : ''
  document.querySelector('#status').innerText = 'Settings restored.'
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('reset').addEventListener('click', restoreOptions)

async function saveSettings () {
  document.querySelector('#status').innerText = 'Saving settings...'
  const optionsForm = document.querySelector('#options-form')
  const token = optionsForm.token.value

  // TODO: validate token
  await browser.storage.sync.set({
    [TOKEN_DATA]: token
      ? {
          token: optionsForm.token.value,
          email: 'foo@bar.com',
          login: 'foobar'
        }
      : null,
    [AUTOMATIC_DATA_UPDATE]: optionsForm.automaticDataUpdate.checked,
    [UPDATE_INTERVAL]: optionsForm.updateInterval.value
  })
  document.querySelector('#status').innerText = 'Options saved.'
}

document.getElementById('save').addEventListener('click', saveSettings)

async function triggerUpdate () {
  document.querySelector('#status').innerText = 'Updating data...'
  const completed = await browser.runtime.sendMessage({ updateData: true })

  if (completed === true) {
    document.querySelector('#status').innerText = 'Data updated!'
  }

  if (completed === false) {
    document.querySelector('#status').innerText = 'Problem during update'
  }
}

document.getElementById('update').addEventListener('click', triggerUpdate)
