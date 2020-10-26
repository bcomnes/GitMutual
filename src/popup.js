import browser from 'webextension-polyfill'

async function openSettings () {
  await browser.runtime.openOptionsPage()
  console.log('options opened')
}

document.getElementById('options-button').addEventListener('click', openSettings)

async function openUnfollowers () {
  const createData = { url: 'unfollowers.html' }
  await browser.tabs.create(createData)
  console.log('unfollowers.html opened')
}

document.getElementById('unfollowers-button').addEventListener('click', openUnfollowers)
