import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { StateManager } from './state.js';
import { IFocusController } from './focus-controller.js';
import { ProtocolValidator } from './protocol.js';
import { OutboundEvent } from './types.js';
import { PairingManager } from './pairing.js';

const BIND_PORT = 4545;
const BIND_HOST = '127.0.0.1';
const AGENT_VERSION = '0.1.0';

export class AgentWebSocketServer {
  private wss: WebSocketServer | null = null;
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

    // Phase 7: Handle authoritative timer expiration automatically
    this.stateManager.on('timerExpired', async () => {
      console.log('[AgentWSServer] Timer expired! Automatically exiting focus session...');
      await this.focusController.exitFocus();
      this.stateManager.setEnded();
    });

    // Subscribe to state changes
    this.stateManager.on('state', ({ state, session }) => {
      this.broadcast({
        type: 'state',
        state,
        session,
        isPaired: this.pairingManager.isPaired(),
      });
    });

    this.stateManager.on('focusStarted', (session) => {
      this.broadcast({
        type: 'focusStarted',
        destination: session.destination,
        durationMin: session.durationMin,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
      });
    });

    this.stateManager.on('focusEnded', () => {
      this.broadcast({ type: 'focusEnded' });
    });

    this.stateManager.on('error', (message: string) => {
      this.broadcast({ type: 'error', message });
    });
  }

  public start(): void {
    try {
      this.wss = new WebSocketServer({ host: BIND_HOST, port: BIND_PORT });

      this.wss.on('listening', () => {
        console.log(`[AgentWSServer] Local Focus Agent WebSocket running strictly on ws://${BIND_HOST}:${BIND_PORT}`);
      });

      this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const remoteIp = req.socket.remoteAddress;
        if (remoteIp && remoteIp !== '127.0.0.1' && remoteIp !== '::1' && remoteIp !== '::ffff:127.0.0.1') {
          console.warn(`[AgentWSServer] Rejected non-localhost connection attempt from IP: ${remoteIp}`);
          ws.close(1008, 'Localhost connections only');
          return;
        }

        console.log('[AgentWSServer] Web browser client connected over localhost.');

        // Initial handshake events
        this.send(ws, {
          type: 'hello',
          version: AGENT_VERSION,
          state: this.stateManager.getState(),
          isPaired: this.pairingManager.isPaired(),
        });

        this.send(ws, {
          type: 'state',
          state: this.stateManager.getState(),
          session: this.stateManager.getSession(),
          isPaired: this.pairingManager.isPaired(),
        });

        ws.on('message', async (raw: string) => {
          try {
            const command = ProtocolValidator.parseAndValidate(raw.toString());
            await this.handleCommand(ws, command);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Invalid command execution';
            console.warn('[AgentWSServer] Protocol validation error:', errMsg);
            this.send(ws, { type: 'error', message: errMsg });
          }
        });

        ws.on('close', () => {
          console.log('[AgentWSServer] Client connection closed.');
        });
      });
    } catch (err) {
      console.error('[AgentWSServer] Failed to start WebSocket server:', err);
    }
  }

  private async handleCommand(
    ws: WebSocket,
    command: ReturnType<typeof ProtocolValidator.parseAndValidate>
  ): Promise<void> {
    console.log('[AgentWSServer] Executing validated command:', command.type);

    switch (command.type) {
      case 'getState': {
        this.send(ws, {
          type: 'state',
          state: this.stateManager.getState(),
          session: this.stateManager.getSession(),
          isPaired: this.pairingManager.isPaired(),
        });
        break;
      }

      case 'getPairingCode': {
        // Return pairing status (code is kept private in tray or returned if unpaired)
        this.send(ws, {
          type: 'pairingStatus',
          isPaired: this.pairingManager.isPaired(),
        });
        break;
      }

      case 'pair': {
        const success = this.pairingManager.validateAndPair(command.code);
        if (success) {
          this.broadcast({
            type: 'pairingStatus',
            isPaired: true,
            message: 'Local agent successfully paired!',
          });
          this.broadcastStatus();
        } else {
          this.send(ws, {
            type: 'error',
            message: 'Invalid pairing code. Check the 6-digit code in the agent system tray menu.',
          });
        }
        break;
      }

      case 'enterFocus': {
        // Phase 8 Rule: Require pairing before initiating focus mode
        if (!this.pairingManager.isPaired()) {
          this.send(ws, {
            type: 'error',
            message: 'Local agent not paired. Please enter the 6-digit pairing code shown in the agent system tray.',
          });
          return;
        }

        const { destination, durationMin } = command;
        try {
          await this.focusController.enterFocus({ destination, durationMin });
          this.stateManager.setFocusing(destination, durationMin);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn('[AgentWSServer] enterFocus failed:', errorMsg);
          this.stateManager.setError(errorMsg);
        }
        break;
      }

      case 'exitFocus': {
        await this.focusController.exitFocus();
        this.stateManager.setEnded();
        break;
      }
    }
  }

  private broadcastStatus(): void {
    this.broadcast({
      type: 'state',
      state: this.stateManager.getState(),
      session: this.stateManager.getSession(),
      isPaired: this.pairingManager.isPaired(),
    });
  }

  private broadcast(event: OutboundEvent): void {
    if (!this.wss) return;
    const payload = JSON.stringify(event);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  private send(ws: WebSocket, event: OutboundEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  public stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
