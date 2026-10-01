export type AgentConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export type AgentState = 'READY' | 'FOCUSING' | 'ERROR';

export type FocusModeState = 'IDLE' | 'FOCUSING';

export interface FocusOptions {
  destination: string;
  durationMin: number;
}

export interface FocusSessionInfo {
  destination: string;
  durationMin: number;
  startedAt: number;
  endsAt: number;
  remainingSeconds: number;
}

export interface FocusSession {
  destination: string;
  url: string;
  durationMinutes: number;
  startTime: number;
  endsAt: number;
  remainingSeconds: number;
}

// Inbound commands to Agent (Browser -> Agent)
export type ClientCommand =
  | { type: 'getState' }
  | { type: 'getPairingCode' }
  | { type: 'pair'; code: string }
  | { type: 'enterFocus'; durationMin: number; destination: string }
  | { type: 'exitFocus' };

// Outbound events from Agent (Agent -> Browser)
export type AgentEvent =
  | { type: 'hello'; version: string; state: AgentState; isPaired: boolean }
  | { type: 'state'; state: AgentState; session: FocusSessionInfo | null; isPaired: boolean }
  | {
      type: 'focusStarted';
      destination: string;
      durationMin: number;
      startedAt: number;
      endsAt: number;
    }
  | { type: 'focusEnded' }
  | { type: 'pairingStatus'; isPaired: boolean; message?: string }
  | { type: 'error'; message: string };
