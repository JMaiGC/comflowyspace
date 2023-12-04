import path from 'path'
import { app, ipcMain } from 'electron'
// import prepareNext from 'electron-next'
import { windowManger } from "./windows-manager";
import "./prelaunch";
import { startAutoUpdater } from './auto-update';
import { startIPC } from './ipc';

// Prepare the renderer once the app is ready
const rendererPath = path.join(__dirname, "../renderer");
console.log("started:", rendererPath);

import { startAppServer } from '@comflowy/node/src/app';

/**
 * Disable Hardware Acceleration for more power-save
 */
app.disableHardwareAcceleration();

app.on('ready', async () => {
  // run next frontend service
  // await prepareNext(rendererPath)
  await startAppServer();

  // start desktop window
  await windowManger.createMainWindow();

  // message hub
  startIPC();

  // auto update listener
  startAutoUpdater()
  ipcMain.emit('some-event', 'Hello from main process!');
})

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit)

app.on("activate", windowManger.restoreOrCreateWindow);

