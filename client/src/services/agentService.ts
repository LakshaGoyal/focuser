import type {
  AgentConnectionStatus,
  AgentEvent,
  ClientCommand,
  FocusModeState,
  FocusSession,
  FocusSessionInfo,
} from '../types/agent';

export interface AgentServiceListener {
  onStatusChange?: (status: AgentConnectionStatus) => void;
  onFocusStateChange?: (state: FocusModeState, session: FocusSession | null) => void;
  onError?: (errorMessage: string) => void;
  onFocusEnded?: () => void;
}

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://127.0.0.1:4545';

export class AgentService {
  private ws: WebSocket | null = null;
  private listeners: Set<AgentServiceListener> = new Set();
  private connectionStatus: AgentConnectionStatus = 'DISCONNECTED';
  private focusState: FocusModeState = 'IDLE';
  private currentSession: FocusSession | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSimulatedMode: boolean = false;
  private simTimer: ReturnType<typeof setInterval> | null = null;

  public subscribe(listener: AgentServiceListener): () => void {
    this.listeners.add(listener);
    listener.onStatusChange?.(this.connectionStatus);
    listener.onFocusStateChange?.(this.focusState, this.currentSession);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public connect(): void {
    if (this.isSimulatedMode) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setConnectionStatus('CONNECTING');

    try {
      this.ws = new WebSocket(AGENT_WS_URL);

      this.ws.onopen = () => {
        this.setConnectionStatus('CONNECTED');
        // Request agent state using Phase 3 command
        this.sendCommand({ type: 'getState' });
      };

      this.ws.onmessage = (event) => {
        try {
          const agentEvent: AgentEvent = JSON.parse(event.data);
          this.handleAgentEvent(agentEvent);
        } catch (err) {
          console.error('[AgentService] Error parsing agent event:', err);
        }
      };

      this.ws.onerror = () => {
        // Handled in onclose
      };

      this.ws.onclose = () => {
        this.setConnectionStatus('DISCONNECTED');
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch {
      this.setConnectionStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.simTimer) clearInterval(this.simTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionStatus('DISCONNECTED');
  }

  public startFocus(destination: string, _url: string, durationMinutes: number): void {
    if (this.isSimulatedMode) {
      this.startSimulatedFocus(destination, _url, durationMinutes);
      return;
    }

    // Send Phase 3 enterFocus command
    this.sendCommand({
      type: 'enterFocus',
      durationMin: durationMinutes,
      destination,
    });
  }

  public exitFocus(): void {
    if (this.isSimulatedMode) {
      this.exitSimulatedFocus();
      return;
    }

    // Send Phase 3 exitFocus command
    this.sendCommand({ type: 'exitFocus' });
  }

  public setSimulatedMode(enabled: boolean): void {
    this.isSimulatedMode = enabled;
    if (enabled) {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.setConnectionStatus('CONNECTED');
    } else {
      this.connect();
    }
  }

  public triggerSimulatedError(message: string): void {
    this.notifyError(message);
  }

  private startSimulatedFocus(destination: string, url: string, durationMinutes: number): void {
    const durationSeconds = Math.max(1, durationMinutes * 60);
    const startTime = Date.now();
    const endsAt = startTime + durationSeconds * 1000;
    this.currentSession = {
      destination,
      url: url || 'https://codeforces.com',
      durationMinutes,
      startTime,
      endsAt,
      remainingSeconds: durationSeconds,
    };
    this.setFocusState('FOCUSING', this.currentSession);

    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimer = setInterval(() => {
      if (!this.currentSession) return;
      this.currentSession.remainingSeconds -= 1;

      if (this.currentSession.remainingSeconds <= 0) {
        this.exitSimulatedFocus();
        this.notifyFocusEnded();
      } else {
        this.setFocusState('FOCUSING', { ...this.currentSession });
      }
    }, 1000);
  }

  private exitSimulatedFocus(): void {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    this.currentSession = null;
    this.setFocusState('IDLE', null);
  }

  private handleAgentEvent(event: AgentEvent): void {
    console.log('[AgentService] Received event from agent:', event.type);

    switch (event.type) {
      case 'hello':
        console.log(`[AgentService] Connected to Focuser Agent v${event.version}`);
        break;

      case 'state': {
        const isFocusing = event.state === 'FOCUSING';
        const uiState: FocusModeState = isFocusing ? 'FOCUSING' : 'IDLE';
        const session = this.mapSessionInfo(event.session);
        this.setFocusState(uiState, session);
        break;
      }

      case 'focusStarted': {
        const session: FocusSession = {
          destination: event.destination,
          url: event.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com' : `https://${event.destination}`,
          durationMinutes: event.durationMin,
          startTime: event.startedAt,
          endsAt: event.endsAt,
          remainingSeconds: event.durationMin * 60,
        };
        this.setFocusState('FOCUSING', session);
        break;
      }

      case 'focusEnded':
        this.setFocusState('IDLE', null);
        this.notifyFocusEnded();
        break;

      case 'error':
        this.notifyError(event.message);
        break;
    }
  }

  private mapSessionInfo(info: FocusSessionInfo | null): FocusSession | null {
    if (!info) return null;
    return {
      destination: info.destination,
      url: info.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com' : `https://${info.destination}`,
      durationMinutes: info.durationMin,
      startTime: info.startedAt,
      endsAt: info.endsAt,
      remainingSeconds: info.remainingSeconds,
    };
  }

  private sendCommand(command: ClientCommand): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      console.warn('[AgentService] Cannot send command, socket not open:', command);
    }
  }

  private setConnectionStatus(status: AgentConnectionStatus): void {
    this.connectionStatus = status;
    this.listeners.forEach((l) => l.onStatusChange?.(status));
  }

  private setFocusState(state: FocusModeState, session: FocusSession | null): void {
    this.focusState = state;
    this.currentSession = session;
    this.listeners.forEach((l) => l.onFocusStateChange?.(state, session));
  }

  private notifyError(message: string): void {
    this.listeners.forEach((l) => l.onError?.(message));
  }

  private notifyFocusEnded(): void {
    this.listeners.forEach((l) => l.onFocusEnded?.());
  }

  private scheduleReconnect(): void {
    if (this.isSimulatedMode) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public getConnectionStatus(): AgentConnectionStatus {
    return this.connectionStatus;
  }

  public getFocusState(): FocusModeState {
    return this.focusState;
  }

  public getCurrentSession(): FocusSession | null {
    return this.currentSession;
  }
}

export const agentService = new AgentService();
