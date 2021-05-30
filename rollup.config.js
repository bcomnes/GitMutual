import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'

function plugins () {
  return [
    resolve({ browser: true }),
    commonjs(),
    json()
  ]
}

const OUTPUT_DIR = 'Resources/dist'

export default [
  {
    input: ['src/background.js', 'src/popup.js', 'src/options.js', 'src/unfollowers.js'],
    plugins: plugins(),
    output: {
      dir: OUTPUT_DIR,
      format: 'es',
      chunkFileNames: '[format]-[name]-[hash].js'
    }
  },
  {
    input: ['src/content.js'],
    plugins: plugins(),
    output: {
      dir: OUTPUT_DIR,
      format: 'umd',
      name: 'gitMutual'
    }
  }
]
