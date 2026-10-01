import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { FocusSessionInfo } from './types.js';

export class RecoveryManager {
  private sessionFilePath: string;

  constructor() {
    const userDataPath = app?.getPath('userData') || process.cwd();
    this.sessionFilePath = path.join(userDataPath, 'active-session.json');
  }

  public saveActiveSession(session: FocusSessionInfo): void {
    try {
      fs.writeFileSync(this.sessionFilePath, JSON.stringify(session, null, 2), 'utf-8');
      console.log('[RecoveryManager] Active focus session state persisted for fail-safe recovery.');
    } catch (err) {
      console.error('[RecoveryManager] Failed to save active session state:', err);
    }
  }

  public getUnfinishedSession(): FocusSessionInfo | null {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        const data = fs.readFileSync(this.sessionFilePath, 'utf-8');
        const session: FocusSessionInfo = JSON.parse(data);
        if (session && session.endsAt) {
          return session;
        }
      }
    } catch (err) {
      console.warn('[RecoveryManager] Failed to read unfinished session:', err);
    }
    return null;
  }

  public clearActiveSession(): void {
    try {
      if (fs.existsSync(this.sessionFilePath)) {
        fs.unlinkSync(this.sessionFilePath);
        console.log('[RecoveryManager] Active session state cleared.');
      }
    } catch (err) {
      console.error('[RecoveryManager] Failed to clear session file:', err);
    }
  }
}
