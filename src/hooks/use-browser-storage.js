import { useState, useEffect } from 'uland'

export function useLocalData (keys = {}) {
  return useBrowserData('local', keys)
}

export function useSyncData (keys = {}) {
  return useBrowserData('sync', keys)
}

export function useBrowserData (namespace, keys = {}) {
  const [loading, setLoading] = useState(true)

  const states = createStates(keys)
  debugger
  useEffect(() => {
    const storageListener = createListener(namespace, states)
    debugger
    const getInitial = async () => {
      console.log('loading')
      const results = await getData(namespace, states)

      for (const [key, data] of Object.entries(results)) {
        const setState = states[key].stateHook[1]
        console.log(key, data)
        setState(data)
      }

      browser.storage.onChanged.addListener(storageListener)
      setLoading(false)
    }

    getInitial()

    return () => {
      console.log('unloading')
      browser.storage.onChanged.removeListener(storageListener)
    }
  })

  const stateResults = {}

  for (const { name, stateHook } of Object.values(states)) {
    const stateName = name
    const setStateName = `set${capitalizeFirstLetter(stateName)}`

    stateResults[stateName] = stateHook[0]
    stateResults[setStateName] = stateHook[1]
  }

  stateResults.loading = loading
  console.log(stateResults)
  return stateResults
}

function createStates (valueConfig) {
  const states = {}

  for (const [name, details] of Object.entries(valueConfig)) {
    const key = typeof details === 'string' ? details : details.key
    const defaultValue = typeof details === 'string' ? null : details.default

    const stateHook = useState(defaultValue)

    states[key] = {
      name,
      key,
      stateHook,
      defaultValue
    }
  }

  return states
}

function createGet (states = {}) {
  const get = {}
  for (const { key, defaultValue } of Object.values(states)) {
    get[key] = defaultValue
  }
  console.log(get)
  return get
}

async function getData (namespace, states = {}) {
  const get = createGet(states)

  const results = Object.keys(get).length > 0
    ? await (browser.storage[namespace].get(get))
    : {}

  return results
}

function createListener (namespace, states = {}) {
  return (changes, areaName) => {
    for (const [k, { newValue }] of Object.entries(changes)) {
      if (areaName === namespace && Boolean(states[k])) {
        console.log(`setting ${k} in ${namespace}`)
        states[k].stateHook[1](newValue)
      }
    }
  }
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
