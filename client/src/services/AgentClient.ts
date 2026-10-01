import type {
  AgentConnectionStatus,
  AgentEvent,
  ClientCommand,
  FocusModeState,
  FocusOptions,
  FocusSession,
  FocusSessionInfo,
} from '../types/agent';

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://127.0.0.1:4545';
const RECONNECT_INTERVAL_MS = 3000;

export type StateChangeListener = (
  state: FocusModeState,
  session: FocusSession | null
) => void;
export type EventListener = (event: AgentEvent) => void;
export type ConnectionStatusListener = (status: AgentConnectionStatus) => void;
export type PairingChangeListener = (isPaired: boolean) => void;

export class AgentClient {
  private ws: WebSocket | null = null;
  private connectionStatus: AgentConnectionStatus = 'DISCONNECTED';
  private focusState: FocusModeState = 'IDLE';
  private currentSession: FocusSession | null = null;
  private isPairedState: boolean = false;

  private stateListeners: Set<StateChangeListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private pairingListeners: Set<PairingChangeListener> = new Set();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnect: boolean = true;

  public connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.autoReconnect = true;
    this.updateStatus('CONNECTING');

    try {
      const socket = new WebSocket(AGENT_WS_URL);
      this.ws = socket;

      socket.onopen = () => {
        console.log('[AgentClient] Connected to local Electron agent at 127.0.0.1:4545');
        this.updateStatus('CONNECTED');
        this.getState();
      };

      socket.onmessage = (messageEvent) => {
        try {
          const eventData: AgentEvent = JSON.parse(messageEvent.data);
          this.handleIncomingEvent(eventData);
        } catch (err) {
          console.error('[AgentClient] Error parsing incoming WebSocket event:', err);
          this.notifyEvent({
            type: 'error',
            message: 'Malformed response received from local agent',
          });
        }
      };

      socket.onerror = (error) => {
        console.warn('[AgentClient] WebSocket connection error / Agent Not Running:', error);
      };

      socket.onclose = () => {
        console.log('[AgentClient] Connection closed.');
        this.ws = null;
        this.updateStatus('DISCONNECTED');
        this.notifyState('IDLE', null);

        if (this.autoReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[AgentClient] Failed to create WebSocket connection:', err);
      this.updateStatus('DISCONNECTED');
      if (this.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    this.autoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('DISCONNECTED');
  }

  public getState(): void {
    this.sendCommand({ type: 'getState' });
  }

  public pair(code: string): void {
    this.sendCommand({ type: 'pair', code: code.trim() });
  }

  public startFocus(options: FocusOptions): void {
    if (this.focusState === 'FOCUSING') {
      console.warn('[AgentClient] Focus session is already active');
      this.notifyEvent({
        type: 'error',
        message: 'A focus session is already active.',
      });
      return;
    }

    this.sendCommand({
      type: 'enterFocus',
      destination: options.destination,
      durationMin: options.durationMin,
    });
  }

  public exitFocus(): void {
    this.sendCommand({ type: 'exitFocus' });
  }

  public subscribeToState(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    listener(this.focusState, this.currentSession);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public subscribeToEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public subscribeToStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeToPairing(listener: PairingChangeListener): () => void {
    this.pairingListeners.add(listener);
    listener(this.isPairedState);
    return () => {
      this.pairingListeners.delete(listener);
    };
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

  public isPaired(): boolean {
    return this.isPairedState;
  }

  private handleIncomingEvent(event: AgentEvent): void {
    console.log('[AgentClient] Event received from agent:', event.type);
    this.notifyEvent(event);

    switch (event.type) {
      case 'hello':
        this.updatePairing(Boolean(event.isPaired));
        break;

      case 'state': {
        this.updatePairing(Boolean(event.isPaired));
        const isFocusing = event.state === 'FOCUSING';
        const state: FocusModeState = isFocusing ? 'FOCUSING' : 'IDLE';
        const session = this.mapSessionInfo(event.session);
        this.notifyState(state, session);
        break;
      }

      case 'pairingStatus':
        this.updatePairing(Boolean(event.isPaired));
        break;

      case 'focusStarted': {
        const remainingSeconds = Math.max(0, Math.ceil((event.endsAt - Date.now()) / 1000));
        const session: FocusSession = {
          destination: event.destination,
          url: event.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com/' : `https://${event.destination}`,
          durationMinutes: event.durationMin,
          startTime: event.startedAt,
          endsAt: event.endsAt,
          remainingSeconds,
        };
        this.notifyState('FOCUSING', session);
        break;
      }

      case 'focusEnded':
        this.notifyState('IDLE', null);
        break;

      case 'error':
        console.warn('[AgentClient] Agent reported error:', event.message);
        break;
    }
  }

  private mapSessionInfo(info: FocusSessionInfo | null): FocusSession | null {
    if (!info) return null;
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.ceil((info.endsAt - now) / 1000));
    return {
      destination: info.destination,
      url: info.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com/' : `https://${info.destination}`,
      durationMinutes: info.durationMin,
      startTime: info.startedAt,
      endsAt: info.endsAt,
      remainingSeconds,
    };
  }

  private sendCommand(command: ClientCommand): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      console.warn('[AgentClient] Cannot send command, Agent Not Running:', command);
      this.notifyEvent({
        type: 'error',
        message: 'Focus Agent is not running. Make sure the desktop agent is running on 127.0.0.1:4545',
      });
    }
  }

  private updateStatus(status: AgentConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private updatePairing(isPaired: boolean): void {
    this.isPairedState = isPaired;
    this.pairingListeners.forEach((listener) => listener(isPaired));
  }

  private notifyState(state: FocusModeState, session: FocusSession | null): void {
    this.focusState = state;
    this.currentSession = session;
    this.stateListeners.forEach((listener) => listener(state, session));
  }

  private notifyEvent(event: AgentEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.autoReconnect) {
        console.log('[AgentClient] Attempting auto-reconnect to 127.0.0.1:4545...');
        this.connect();
      }
    }, RECONNECT_INTERVAL_MS);
  }
}

export const agentClient = new AgentClient();
