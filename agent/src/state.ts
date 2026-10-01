import { EventEmitter } from 'events';
import { AgentState, FocusSessionInfo } from './types.js';
import { RecoveryManager } from './recovery.js';

export class StateManager extends EventEmitter {
  private state: AgentState = 'READY';
  private session: FocusSessionInfo | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private recoveryManager: RecoveryManager;

  constructor() {
    super();
    this.recoveryManager = new RecoveryManager();
  }

  public getState(): AgentState {
    return this.state;
  }

  public getSession(): FocusSessionInfo | null {
    if (!this.session) return null;
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.ceil((this.session.endsAt - now) / 1000));
    return {
      ...this.session,
      remainingSeconds,
    };
  }

  public setFocusing(destination: string, durationMin: number): FocusSessionInfo {
    this.stopTimer();

    const now = Date.now();
    const durationMs = Math.max(1, durationMin) * 60 * 1000;
    const endsAt = now + durationMs;

    this.state = 'FOCUSING';
    this.session = {
      destination,
      durationMin,
      startedAt: now,
      endsAt,
      remainingSeconds: Math.ceil(durationMs / 1000),
    };

    // Phase 9: Persist active session state for crash recovery
    this.recoveryManager.saveActiveSession(this.session);

    this.emit('state', { state: this.state, session: this.getSession() });
    this.emit('focusStarted', this.session);

    this.startAuthoritativeTimer();

    return this.session;
  }

  public setEnded(): void {
    this.stopTimer();
    this.state = 'READY';
    this.session = null;

    // Phase 9: Clear persisted session state
    this.recoveryManager.clearActiveSession();

    this.emit('state', { state: this.state, session: null });
    this.emit('focusEnded');
  }

  public setError(message: string): void {
    this.stopTimer();
    this.state = 'ERROR';
    this.recoveryManager.clearActiveSession();
    this.emit('state', { state: this.state, session: this.getSession() });
    this.emit('error', message);
  }

  /**
   * Phase 9: Crash / Restart Recovery Check
   */
  public reconcileUnfinishedSession(onRestoreRequired: () => Promise<void>): void {
    const unfinished = this.recoveryManager.getUnfinishedSession();
    if (!unfinished) return;

    const now = Date.now();
    if (now >= unfinished.endsAt) {
      console.log('[StateManager] Detected unfinished expired session on startup. Triggering safe recovery restoration...');
      onRestoreRequired().finally(() => {
        this.recoveryManager.clearActiveSession();
        this.state = 'READY';
        this.session = null;
      });
    } else {
      console.log('[StateManager] Resuming unfinished active session from recovery store...');
      this.state = 'FOCUSING';
      this.session = unfinished;
      this.startAuthoritativeTimer();
    }
  }

  private startAuthoritativeTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.session) {
        this.stopTimer();
        return;
      }

      const now = Date.now();
      if (now >= this.session.endsAt) {
        console.log('[StateManager] Authoritative agent timer reached endsAt. Session complete.');
        this.emit('timerExpired');
      } else {
        this.emit('tick', this.getSession());
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
