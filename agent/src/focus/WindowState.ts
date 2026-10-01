import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { ProtectedAppsManager } from './protectedApps.js';

export interface StashedWindowInfo {
  handle: string;
  title: string;
  processName?: string;
  processId?: number;
  previousState: 'normal' | 'maximized';
}

export class WindowStateManager {
  private stashedWindows: StashedWindowInfo[] = [];
  private filePath: string;
  private helperPath: string;

  constructor() {
    const userDataPath = app?.getPath('userData') || process.cwd();
    this.filePath = path.join(userDataPath, 'window-state.json');
    
    // Packaged apps cannot pass a script from app.asar to PowerShell. Builder
    // places this helper beside the executable resources instead.
    if (app.isPackaged) {
      // In packaged mode `process.resourcesPath` points to the `resources` folder where
      // win-helper.ps1 is placed by electron-builder.
      let resPath = (process as any).resourcesPath;
      if (!resPath) {
        // Fallback for unexpected environment – look for a `resources` subfolder next to cwd
        resPath = path.join(process.cwd(), 'resources');
      }
      this.helperPath = path.join(resPath, 'win-helper.ps1');
      console.log('[WindowState] Packaged mode helperPath =', this.helperPath);
    } else {
      const distHelper = path.resolve(__dirname, 'win-helper.ps1');
      const srcHelper = path.resolve(__dirname, '../../src/focus/win-helper.ps1');
      this.helperPath = fs.existsSync(distHelper) ? distHelper : srcHelper;
      console.log('[WindowState] Dev mode helperPath =', this.helperPath);
    }
  }

  /**
   * Detects active foreground or active browser window after Codeforces launch.
   */
  public detectAndProtectCodeforcesWindow(): { handle?: string; title?: string; processName?: string } {
    try {
      // First try foreground window query
      const fgOutput = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.helperPath, '-action', 'foreground'], {
        encoding: 'utf-8',
      });
      console.log('[WindowState] foreground output length', fgOutput?.length || 0);
      console.log('[WindowState] foreground raw output:', fgOutput);


      if (fgOutput && fgOutput.trim() && fgOutput.trim() !== '{}') {
        const jsonStart = Math.max(fgOutput.indexOf('{'), fgOutput.indexOf('['));
        if (jsonStart !== -1) {
          const parsed = JSON.parse(fgOutput.substring(jsonStart).trim());
          const title = parsed.Title || '';
          const procName = parsed.ProcessName || '';
          const handle = parsed.Handle || '';

          if (title.toLowerCase().includes('codeforces') || ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi', 'arc'].includes(procName.toLowerCase())) {
            if (handle) ProtectedAppsManager.addDynamicProtectedHwnd(handle);
            ProtectedAppsManager.addDynamicProtectedTitle('codeforces');
            console.log('[FocusController] Codeforces window detected');
            console.log(`[FocusController] HWND: ${handle}`);
            console.log(`[FocusController] Process: ${procName || 'browser'}`);
            return { handle, title, processName: procName };
          }
        }
      }

      // Fallback: enumerate all visible windows to find codeforces title or active browser
      const enumOutput = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.helperPath, '-action', 'enumerate'], {
        encoding: 'utf-8',
      });
      console.log('[WindowState] enumerate output length', enumOutput?.length || 0);
      console.log('[WindowState] enumerate raw output:', enumOutput);


      if (enumOutput && enumOutput.trim()) {
        const jsonStart = Math.max(enumOutput.indexOf('['), enumOutput.indexOf('{'));
        if (jsonStart !== -1) {
          const parsed = JSON.parse(enumOutput.substring(jsonStart).trim());
          const list: any[] = Array.isArray(parsed) ? parsed : [parsed];
          const cfWin = list.find(w => w.Title && w.Title.toLowerCase().includes('codeforces'));
          if (cfWin) {
            if (cfWin.Handle) ProtectedAppsManager.addDynamicProtectedHwnd(cfWin.Handle);
            ProtectedAppsManager.addDynamicProtectedTitle('codeforces');
            console.log('[FocusController] Codeforces window detected');
            console.log(`[FocusController] HWND: ${cfWin.Handle}`);
            console.log(`[FocusController] Process: ${cfWin.ProcessName || 'browser'}`);
            return { handle: cfWin.Handle, title: cfWin.Title, processName: cfWin.ProcessName };
          }
        }
      }
    } catch (err) {
      console.warn('[FocusController] Codeforces window detection notice:', err);
    }

    ProtectedAppsManager.addDynamicProtectedTitle('codeforces');
    return {};
  }

  /**
   * Enumerates visible desktop application windows, identifies protected apps, and minimizes distracting user windows.
   */
  public stepAsideDistractingWindows(): StashedWindowInfo[] {
    console.log('[WindowsFocusController] Enumerating windows...');
    this.stashedWindows = [];

    try {
      const rawOutput = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.helperPath, '-action', 'enumerate'], {
        encoding: 'utf-8',
      });

      if (rawOutput && rawOutput.trim()) {
        const arrayStart = rawOutput.indexOf('[');
        const objectStart = rawOutput.indexOf('{');
        const jsonStart = arrayStart === -1
          ? objectStart
          : objectStart === -1
            ? arrayStart
            : Math.min(arrayStart, objectStart);

        if (jsonStart !== -1) {
          const jsonStr = rawOutput.substring(jsonStart).trim();
          const parsed = JSON.parse(jsonStr);
          const rawList: { Handle: string; Title: string; ProcessName?: string; ProcessId?: number; IsMinimized?: boolean }[] = Array.isArray(parsed) ? parsed : [parsed];

          // Deduplicate by Handle
          const seenHandles = new Set<string>();
          const windows = rawList.filter((item) => {
            if (!item || !item.Handle || seenHandles.has(item.Handle)) return false;
            seenHandles.add(item.Handle);
            return true;
          });

          console.log(`[WindowsFocusController] Found ${windows.length} visible windows`);

          const handlesToMinimize: string[] = [];

          for (const win of windows) {
            const title = win.Title || '';
            const procName = win.ProcessName || '';

            if (ProtectedAppsManager.isProtectedWindow(win.Handle, title, procName)) {
              if (title.toLowerCase().includes('codeforces')) {
                console.log(`[WindowsFocusController] Protected Codeforces window: "${title}" (HWND: ${win.Handle})`);
              } else if (title.toLowerCase().includes('focuser') || title.toLowerCase().includes('electron') || procName.toLowerCase().includes('focuser')) {
                console.log(`[WindowsFocusController] Protected Focuser agent: "${title || 'Focuser Desktop'}" (HWND: ${win.Handle})`);
              } else {
                console.log(`[WindowsFocusController] Protected system/allow-listed window: "${title || procName}"`);
              }
            } else {
              console.log(`[WindowsFocusController] Minimizing: ${title || procName || 'User Application'} (HWND: ${win.Handle})`);
              this.stashedWindows.push({
                handle: win.Handle,
                title,
                processName: procName,
                processId: win.ProcessId,
                previousState: win.IsMinimized ? 'normal' : 'normal',
              });
              handlesToMinimize.push(win.Handle);
            }
          }

          if (handlesToMinimize.length > 0) {
            execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.helperPath, '-action', 'minimize', '-handles', handlesToMinimize.join(',')], {
              encoding: 'utf-8',
            });
          }
        }
      }

      this.saveState();
    } catch (err) {
      console.warn('[WindowStateManager] Window management notice:', err);
    }

    console.log('[WindowsFocusController] Focus mode active');
    return this.stashedWindows;
  }

  /**
   * Restores previously stashed user application windows to their desktop layout.
   */
  public restorePreviousWindows(): void {
    if (this.stashedWindows.length === 0) {
      this.loadSavedState();
    }

    console.log(`[WindowStateManager] Restoring ${this.stashedWindows.length} previously stashed application windows...`);

    if (this.stashedWindows.length > 0) {
      const handlesToRestore = this.stashedWindows.map(w => w.handle).filter(Boolean);
      for (const win of this.stashedWindows) {
        console.log(`[WindowStateManager] Restoring window: "${win.title || win.processName || 'User Window'}" (HWND: ${win.handle})`);
      }

      try {
        if (handlesToRestore.length > 0) {
          try {
            execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this.helperPath, '-action', 'restore', '-handles', handlesToRestore.join(',')], {
              encoding: 'utf-8',
            });
            console.log('[WindowState] restore executed for handles', handlesToRestore);
          } catch (restoreErr) {
            console.error('[WindowState] restore error:', restoreErr);
          }
        }
      } catch (err) {
        console.warn('[WindowStateManager] Notice while restoring windows:', err);
      }
    }

    this.stashedWindows = [];
    this.clearSavedState();
    ProtectedAppsManager.clearDynamicProtections();
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.stashedWindows, null, 2), 'utf-8');
    } catch {
      // Non-fatal logging
    }
  }

  private loadSavedState(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.stashedWindows = JSON.parse(data);
      }
    } catch {
      this.stashedWindows = [];
    }
  }

  private clearSavedState(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore
    }
  }
}
