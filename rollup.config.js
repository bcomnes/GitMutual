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

const OUTPUT_DIR = 'dist'

export default [
  {
    input: [
      'src/background/background.js',
      'src/popup/popup.js',
      'src/options/options.js',
      'src/unfollowers/unfollowers.js'
    ],
    plugins: plugins(),
    output: {
      dir: OUTPUT_DIR,
      entryFileNames: '[name]/[name].js',
      format: 'es',
      chunkFileNames: 'chunks/[format]-[name]-[hash].js',
      sourcemap: true
    }
  },
  {
    input: ['src/content/content.js'],
    plugins: plugins(),
    output: {
      dir: OUTPUT_DIR,
      entryFileNames: '[name]/[name].js',
      format: 'umd',
      name: 'gitMutual'
    }
  }
]
