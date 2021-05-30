if (window.browser) {
  import('./content-esm.js')
} else {
  import('webextension-polyfill').then(() => import('./content-esm.js')).catch(console.error)
}
