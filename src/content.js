browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received request: ', request)
})

const whoAmI = document.querySelector('header.Header summary.Header-link img.avatar').alt.split('@')[1]

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
  const loginList = gatherProfileListNames()
  if (loginList && loginList.length > 0) {
    browser.runtime.sendMessage({ userListQuery: { loginList, targetLogin: whoAmI } }).then((relList) => {
      const loginNodes = gatherProfileListNodes()
      const loginNodeMap = {}
      for (const node of loginNodes) {
        loginNodeMap[node.innerText] = node
      }

      console.log(loginNodeMap)

      for (const rel of relList.filter(rel => rel.follower)) {
        const node = loginNodeMap[rel.login]
        if (node) node.innerHTML = `${rel.login} <span class="Label Label--green text-uppercase">Follows you</span>`
      }

      for (const rel of relList.filter(rel => rel.unfollower)) {
        const node = loginNodeMap[rel.login]
        if (node) node.innerHTML = `${rel.login} <span class="Label Label--red text-uppercase">Unfollowed you</span>`
      }
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

function gatherProfileListNodes () {
  return document.querySelectorAll('.page-profile a span.link-gray')
}

function gatherProfileListNames () {
  try {
    return Array.from(gatherProfileListNodes()).map(node => node.innerText)
  } catch (e) {
    console.warn('Error gathering profile names')
    console.warn(e)
  }
}

function updateFollowingStatus () {
  browser.runtime.sendMessage({ profileQuery: { userLogin: profileName, targetLogin: whoAmI } }).then((response) => {
    if (response && response.follower === true) {
      const nicknameNode = document.querySelector('.h-card .p-nickname')
      nicknameNode.innerHTML = `${profileName} <span class="Label Label--green text-uppercase">Follows you</span>`
    }

    if (response && response.unfollower === true) {
      const nicknameNode = document.querySelector('.h-card .p-nickname')
      nicknameNode.innerHTML = `${profileName} <span class="Label Label--red text-uppercase">Unfollowed you</span>`
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
