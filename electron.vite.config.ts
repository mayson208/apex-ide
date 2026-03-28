import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Fixes Electron 28 Windows crash: Rollup converts `import { app } from 'electron'`
// to `electron.app` namespace access, but that returns undefined on Windows.
// This plugin rewrites the compiled bundle to use proper CJS destructuring.
function fixElectronImport() {
  return {
    name: 'fix-electron-import',
    renderChunk(code: string) {
      if (!code.includes('require("electron")') && !code.includes("require('electron')")) {
        return null
      }
      const props = new Set<string>()
      const propRegex = /\belectron\.([a-zA-Z][a-zA-Z0-9]*)/g
      let m: RegExpExecArray | null
      while ((m = propRegex.exec(code)) !== null) {
        props.add(m[1])
      }
      if (props.size === 0) return null
      const propList = Array.from(props).join(', ')
      let result = code
      result = result.replace(
        /const electron = require\(["']electron["']\);?\n?/,
        `const { ${propList} } = require("electron");\n`
      )
      for (const prop of props) {
        result = result.replace(new RegExp(`\\belectron\\.${prop}\\b`, 'g'), prop)
      }
      return { code: result, map: null }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), fixElectronImport()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer'),
      },
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.cjs',
    },
  },
})
