import { useState, useEffect } from 'uland'

import {
  TOKEN_DATA
} from '../lib/keys.js'

export function useTokenData () {
  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getInitialStats () {
      const {
        [TOKEN_DATA]: tokenData
      } = await browser.storage.sync.get({
        [TOKEN_DATA]: {}
      })

      setTokenData(tokenData)
      browser.storage.onChanged.addListener(storageListener)
      setLoading(false)
    }

    function storageListener (changes, areaName) {
      if (areaName === 'sync' && changes[TOKEN_DATA]) {
        setTokenData(changes[TOKEN_DATA].newValue)
      }
    }

    getInitialStats()

    return () => {
      browser.storage.onChanged.removeListener(storageListener)
    }
  }, [])

  return { tokenData, loading }
}
