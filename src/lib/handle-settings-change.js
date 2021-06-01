import {
  AUTOMATIC_DATA_UPDATE,
  UPDATE_INTERVAL,
  LAST_UPDATE,
  NEXT_UPDATE,
  UPDATE_ALARM
} from './keys.js'
import { getHourOffset } from './get-hour-offset.js'

export async function handleUpdateIntervalChange (newInterval) {
  const { [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate } = await browser.storage.sync.get(AUTOMATIC_DATA_UPDATE)
  if (automaticDataUpdate) {
    browser.alarms.clear(UPDATE_ALARM)
    const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
    const nextUpdate = getHourOffset(newInterval, lastUpdate)
    browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
    await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
  }
}

export async function handleAutomaticDataUpdateChange (newAutomaticUpdateSetting) {
  if (newAutomaticUpdateSetting === true) {
    browser.alarms.clear(UPDATE_ALARM)
    const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get(LAST_UPDATE)
    const { [UPDATE_INTERVAL]: updateInterval } = await browser.storage.sync.get(UPDATE_INTERVAL)
    const nextUpdate = getHourOffset(updateInterval, lastUpdate)
    browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
    await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
  } else {
    browser.alarms.clear(UPDATE_ALARM)
    await browser.storage.local.set({ [NEXT_UPDATE]: null })
  }
}

export async function handleTokenDataChange (newTokenData) {
  const { [AUTOMATIC_DATA_UPDATE]: automaticDataUpdate, [UPDATE_INTERVAL]: updateInterval } = await browser.storage.sync.get([AUTOMATIC_DATA_UPDATE, UPDATE_INTERVAL])
  if (automaticDataUpdate) {
    if (newTokenData) {
      browser.alarms.clear(UPDATE_ALARM)
      const { [LAST_UPDATE]: lastUpdate } = await browser.storage.local.get([LAST_UPDATE, UPDATE_INTERVAL])
      const nextUpdate = getHourOffset(updateInterval, lastUpdate)
      browser.alarms.create(UPDATE_ALARM, { when: nextUpdate.valueOf() })
      await browser.storage.local.set({ [NEXT_UPDATE]: nextUpdate.toISOString() })
    } else {
      browser.alarms.clear(UPDATE_ALARM)
      await browser.storage.local.set({ [NEXT_UPDATE]: null })
    }
  }

  if (!newTokenData) await browser.storage.local.clear()
}
