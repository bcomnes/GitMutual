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
