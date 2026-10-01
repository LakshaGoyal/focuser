import { Tray, Menu, app, nativeImage } from 'electron';
import { StateManager } from './state.js';
import { IFocusController } from './focus-controller.js';
import { PairingManager } from './pairing.js';

export class AgentTray {
  private tray: Tray | null = null;
  private stateManager: StateManager;
  private focusController: IFocusController;
  private pairingManager: PairingManager;

  constructor(
    stateManager: StateManager,
    focusController: IFocusController,
    pairingManager: PairingManager
  ) {
    this.stateManager = stateManager;
    this.focusController = focusController;
    this.pairingManager = pairingManager;

    this.stateManager.on('state', () => this.updateContextMenu());
    this.stateManager.on('tick', () => this.updateContextMenu());
  }

  public init(): void {
    const icon = nativeImage.createEmpty();
    this.tray = new Tray(icon);
    this.tray.setToolTip('Focuser Local Agent (127.0.0.1:4545)');
    this.updateContextMenu();
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const state = this.stateManager.getState();
    const session = this.stateManager.getSession();
    const isFocusing = state === 'FOCUSING';
    const isPaired = this.pairingManager.isPaired();
    const pairingCode = this.pairingManager.getPairingCode();

    const statusText = isFocusing
      ? `Focusing: ${session?.destination || 'Codeforces'} (${Math.ceil((session?.remainingSeconds || 0) / 60)}m left)`
      : `State: ${state}`;

    const pairingText = isPaired
      ? 'Pairing: Paired ✅'
      : `Pairing Code: ${pairingCode || '------'} 🔑`;

    const contextMenu = Menu.buildFromTemplate(isFocusing ? [
      { label: 'Focuser', enabled: false },
      { type: 'separator' },
      { label: 'Focus Active', enabled: false },
      {
        label: 'Exit Focus',
        enabled: true,
        click: async () => {
          console.log('[AgentTray] Emergency Exit Focus requested via System Tray Menu.');
          await this.focusController.exitFocus();
          this.stateManager.setEnded();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Agent',
        click: () => {
          app.quit();
        },
      },
    ] : [
      { label: 'FOCUSER AGENT', enabled: false },
      { type: 'separator' },
      { label: statusText, enabled: false },
      { label: pairingText, enabled: false },
      { type: 'separator' },
      {
        label: 'Reset Local Pairing',
        click: () => {
          this.pairingManager.resetPairing();
          this.updateContextMenu();
        },
      },
      { type: 'separator' },
      { label: 'Quit Agent', click: () => app.quit() },
    ]);

    this.tray.setContextMenu(contextMenu);
  }
}
