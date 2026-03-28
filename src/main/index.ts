import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { registerFsHandlers } from './ipc-handlers/fs'
import { registerProcessHandlers } from './ipc-handlers/process'
import { registerPtyHandlers } from './ipc-handlers/pty'
import { registerSessionHandlers } from './ipc-handlers/sessions'
import { registerGitHandlers } from './ipc-handlers/git'
import { registerSkillsHandlers } from './ipc-handlers/skills'
import { registerTodosHandlers } from './ipc-handlers/todos'

const isDev = process.env.NODE_ENV === 'development' || !!process.env['ELECTRON_RENDERER_URL']

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#080810',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.apex-ide')
  }

  // Register all IPC handlers
  registerFsHandlers()
  registerProcessHandlers(mainWindow)
  registerPtyHandlers(mainWindow)
  registerSessionHandlers()
  registerGitHandlers()
  registerSkillsHandlers()
  registerTodosHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
