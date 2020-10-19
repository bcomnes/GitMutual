export function splitObject (obj, count = 50) {
  const objArray = []
  let currentObj = null
  for (const [i, [k, v]] of Object.entries(obj).entries()) {
    if (i % count === 0) {
      currentObj = {}
      objArray.push(currentObj)
    }

    currentObj[k] = v
  }

  return objArray
}
