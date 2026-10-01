import { app, BrowserWindow, powerMonitor } from 'electron';
import { StateManager } from './state.js';
import { WindowsFocusController } from './focus-controller.js';
import { AgentWebSocketServer } from './ws-server.js';
import { AgentTray } from './tray.js';
import { PairingManager } from './pairing.js';

app.setAppUserModelId('com.focuser.app');

// Single instance lock requirement to prevent EADDRINUSE conflicts on port 4545
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log('[Main] Another instance of Focuser Agent is already running. Exiting...');
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

const stateManager = new StateManager();
const focusController = new WindowsFocusController();
const pairingManager = new PairingManager();
const wsServer = new AgentWebSocketServer(stateManager, focusController, pairingManager);
const tray = new AgentTray(stateManager, focusController, pairingManager);

app.whenReady().then(() => {
  console.log('[Main] Focuser Desktop Agent starting (Phases 6, 7, 8, 9)...');

  // Start Localhost WebSocket Server strictly on 127.0.0.1:4545
  wsServer.start();

  // Initialize System Tray
  tray.init();

  // Phase 9: Crash Recovery Check on Startup
  stateManager.reconcileUnfinishedSession(async () => {
    console.log('[Main] Restoring desktop window state from unfinished session recovery log...');
    await focusController.exitFocus();
  });

  // Phase 9: Computer Sleep / Wake Reconciliation
  powerMonitor.on('resume', async () => {
    console.log('[Main] Computer resumed from sleep. Reconciling focus session...');
    const session = stateManager.getSession();
    if (session && Date.now() >= session.endsAt) {
      console.log('[Main] Focus session expired while computer was sleeping. Triggering safe exit...');
      await focusController.exitFocus();
      stateManager.setEnded();
    }
  });

  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  console.log(`[Main] Agent ready on ws://127.0.0.1:4545 (Pairing status: ${pairingManager.isPaired() ? 'PAIRED' : 'UNPAIRED - Code: ' + pairingManager.getPairingCode()})`);
});

app.on('window-all-closed', () => {
  // Keep tray background process active on window close
});

app.on('before-quit', () => {
  wsServer.stop();
});
