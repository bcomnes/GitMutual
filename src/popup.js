import browser from 'webextension-polyfill'

async function openSettings () {
  await browser.runtime.openOptionsPage()
  console.log('options opened')
}

document.getElementById('options-button').addEventListener('click', openSettings)
