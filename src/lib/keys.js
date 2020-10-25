export function getRelationKey (targetId, userId) {
  return `rel:${targetId}:${userId}`
}

export function getUserKeyIndexKey (targetId) {
  return `keys:${targetId}`
}

export function getLoginIndexKey (userLogin) {
  return `login:${userLogin}`
}

export function getIdIndexKey (userId) {
  return `id:${userId}`
}

export function getOptsKey (optsKey) {
  return `opts:${optsKey}`
}

export const AUTOMATIC_DATA_UPDATE = getOptsKey('automatic-data-updates')
export const UPDATE_INTERVAL = getOptsKey('update-interval')
export const TOKEN_DATA = getOptsKey('token-data')

export function getStatsKey (statsKey) {
  return `stats:${statsKey}`
}

export const LAST_UPDATE = getStatsKey('last-update')
export const UPDATE_IN_PROGRESS = getStatsKey('update-in-progress')
export const NEXT_UPDATE = getStatsKey('next-update')
export const LAST_UPDATE_ERROR = getStatsKey('last-update-error')

export function getAlarmKey (alarmKey) {
  return `alarm:${alarmKey}`
}

export const UPDATE_ALARM = getAlarmKey('auto-data-updates')
