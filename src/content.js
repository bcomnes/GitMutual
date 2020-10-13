import browser from 'webextension-polyfill'

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received request: ', request)
})

const whoAmI = document.querySelector('a strong.css-truncate-target').innerText

console.log(`Logged in as ${whoAmI}`)

const profileName = getProfileName()
const lookingAtProfile = profileName != null
const lookingAtSelf = lookingAtProfile && (profileName === whoAmI)
const lookingAtOtherProfile = lookingAtProfile && !lookingAtSelf

if (lookingAtProfile) lookingAtSelf ? console.log('looking at your own profile') : console.log(`looking at profile for ${profileName}`)

if (lookingAtOtherProfile && whoAmI) {
  updateFollowingStatus()
}

const searchParams = new URLSearchParams(document.location.search)
const tab = searchParams.get('tab')

if (tab === 'followers') console.log(`looking at ${lookingAtSelf ? 'your' : `${profileName}'s`} followers`)
if (tab === 'following') console.log(`looking at who ${lookingAtSelf ? 'you' : profileName} follow${lookingAtSelf ? '' : 's'}`)

if ((tab === 'following' || tab === 'followers') && whoAmI) {
  const userList = gatherProfileListNames()
  if (userList) {
    browser.runtime.sendMessage({ userListQuery: { userList, target_user: whoAmI } }).then((response) => {
      console.log(response)
    })
  }
}

function getProfileName () {
  try {
    return document.querySelector('.h-card .p-nickname').innerText
  } catch (e) {
    /* swallow */
  }
}

function gatherProfileListNames () {
  try {
    return Array.from(document.querySelectorAll('.page-profile span.link-gray.pl-1')).map(node => node.innerText)
  } catch (e) {
    console.warn('Error gathering profile names')
    console.warn(e)
  }
}

function updateFollowingStatus () {
  browser.runtime.sendMessage({ profileQuery: { username: profileName, target_user: whoAmI } }).then((response) => {
    if (response && response.following === true) {
      const nicknameNode = document.querySelector('.h-card .p-nickname')
      nicknameNode.innerHTML = `${profileName} <span class="label text-uppercase">Follows you</span>`
    }
  })
}

// useful queries

// Profile card
// document.querySelector('.page-profile h1.vcard-names')

// Get all users in following/follower list
// Array.from(document.querySelectorAll('.page-profile span.link-gray.pl-1')).map(node => node.innerText)

// Get all follower listing nodes
// document.querySelectorAll('.page-profile div.d-table-cell.col-9.v-align-top.pr-3')
