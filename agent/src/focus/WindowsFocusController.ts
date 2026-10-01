import { shell } from 'electron';
import { execFile } from 'child_process';
import { AgentState } from '../types.js';
import { IFocusController, EnterFocusOptions } from './FocusController.js';
import { WindowStateManager } from './WindowState.js';

/**
 * Windows-first Focus Controller Implementation.
 * Manages distraction-free environment around Codeforces using User32 Win32 window management.
 */
export class WindowsFocusController implements IFocusController {
  private currentState: AgentState = 'READY';
  private focusWindow?: any; // BrowserWindow instance for Codeforces focus
  private windowStateManager: WindowStateManager;

  constructor() {
    this.windowStateManager = new WindowStateManager();
  }

  public async enterFocus(options: EnterFocusOptions): Promise<void> {
    console.log('[Agent] enterFocus received');

    const rawDest = options.destination.trim().toLowerCase();
    let targetUrl: string;

    if (rawDest === 'codeforces') {
      targetUrl = 'https://codeforces.com/';
      console.log('[Agent] Destination validated: codeforces -> https://codeforces.com/');
    } else if (rawDest.startsWith('http://') || rawDest.startsWith('https://')) {
      targetUrl = options.destination.trim();
      console.log(`[Agent] Destination validated: ${rawDest} -> ${targetUrl}`);
    } else {
      targetUrl = `https://${options.destination.trim()}/`;
      console.log(`[Agent] Destination validated: ${rawDest} -> ${targetUrl}`);
    }

    console.log(`[Agent] Opening ${targetUrl}`);

    try {
      if (rawDest === 'codeforces') {
        // Create a dedicated Electron BrowserWindow for Codeforces focus mode
        const { BrowserWindow } = await import('electron');
        // Ensure only one focus window exists
        if (this.focusWindow && !this.focusWindow.isDestroyed()) {
          this.focusWindow.close();
        }
        this.focusWindow = new BrowserWindow({
          title: 'Codeforces - Focuser',
          fullscreen: true,
          kiosk: true,
          autoHideMenuBar: true,
          alwaysOnTop: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });
        // Load the Codeforces URL inside the Electron window
        await this.focusWindow.loadURL(targetUrl);
        // Give the window a moment to render before proceeding
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        await this.openUrlInDefaultBrowser(targetUrl);
      }
      console.log('[Agent] Codeforces launch request succeeded');
      this.currentState = 'FOCUSING';
      console.log('[Agent] Focus started');

      // Wait briefly for the window to become active (especially for external browser case)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Identify and protect the Codeforces window (Electron window will be detected via title)
      this.windowStateManager.detectAndProtectCodeforcesWindow();

      // Minimize distracting windows while preserving protected ones
      this.windowStateManager.stepAsideDistractingWindows();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Agent] Failed to open Codeforces: ${errorMsg}`);
      console.error('[Agent] Focus start aborted');
      this.currentState = 'ERROR';
      throw new Error(`Failed to open destination: ${errorMsg}`);
    }
  }

  public async exitFocus(): Promise<void> {
    console.log('[Agent] exitFocus received');
    // Close the dedicated Codeforces window if it exists
    if (this.focusWindow && !this.focusWindow.isDestroyed()) {
      this.focusWindow.close();
      this.focusWindow = undefined;
    }
    // Restore previously stashed window layout safely
    this.windowStateManager.restorePreviousWindows();
    this.currentState = 'READY';
    console.log('[Agent] Focus session exited and window layout restored.');
  }

  public getState(): AgentState {
    return this.currentState;
  }

  private async openUrlInDefaultBrowser(url: string): Promise<void> {
    try {
      await shell.openExternal(url);
      return;
    } catch (primaryErr) {
      console.warn('[WindowsFocusController] shell.openExternal failed, using cmd.exe fallback:', primaryErr);
      return new Promise((resolve, reject) => {
        execFile('cmd.exe', ['/c', 'start', '', url], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}
