if (window.browser) {
  import('./content.js')
} else {
  import('webextension-polyfill').then(() => import('./content.js')).catch(console.error)
}
