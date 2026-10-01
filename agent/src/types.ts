export type AgentState = 'READY' | 'FOCUSING' | 'ERROR';

export interface FocusSessionInfo {
  destination: string;
  durationMin: number;
  startedAt: number; // Unix epoch ms
  endsAt: number;    // Unix epoch ms
  remainingSeconds: number;
}

export interface FocusOptions {
  destination: string;
  durationMin: number;
}

// Inbound commands (Browser -> Agent)
export type IncomingCommand =
  | { type: 'getState' }
  | { type: 'enterFocus'; durationMin: number; destination: string }
  | { type: 'exitFocus' }
  | { type: 'getPairingCode' }
  | { type: 'pair'; code: string };

// Outbound events (Agent -> Browser)
export type OutboundEvent =
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
