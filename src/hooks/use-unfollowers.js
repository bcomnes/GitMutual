import { useState, useEffect } from 'uland'

export function useUnfollowers (tokenData) {
  const [unfollowers, setUnfollowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokenData) return null

    async function updateUnfollowers () {
      const latestUnfollowers = await browser.runtime.sendMessage({ getUnfollowers: { loginId: tokenData.id } })

      setUnfollowers(latestUnfollowers)
      setLoading(false)
    }

    updateUnfollowers()
  }, [tokenData])

  return { unfollowers, loading }
}
