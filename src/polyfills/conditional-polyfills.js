(async () => {
  if (!window.browser) {
    console.log('polyfilling web extensions')
    await import('./browser-polyfill.js')
  }
})()
