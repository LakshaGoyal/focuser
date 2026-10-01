import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  AgentConnectionStatus,
  AgentEvent,
  ClientCommand,
  FocusModeState,
  FocusSession,
} from '../types/agent';

const AGENT_WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://127.0.0.1:4545';

export function useAgentSocket() {
  const [connectionStatus, setConnectionStatus] =
    useState<AgentConnectionStatus>('DISCONNECTED');
  const [focusState, setFocusState] = useState<FocusModeState>('IDLE');
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback((msg: ClientCommand) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send command, WebSocket not connected:', msg);
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('CONNECTING');

    try {
      const ws = new WebSocket(AGENT_WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('CONNECTED');
        setLastError(null);
        ws.send(JSON.stringify({ type: 'getState' }));
      };

      ws.onmessage = (event) => {
        try {
          const data: AgentEvent = JSON.parse(event.data);
          switch (data.type) {
            case 'state':
              setFocusState(data.state === 'FOCUSING' ? 'FOCUSING' : 'IDLE');
              if (data.session) {
                setCurrentSession({
                  destination: data.session.destination,
                  url: data.session.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com/' : `https://${data.session.destination}`,
                  durationMinutes: data.session.durationMin,
                  startTime: data.session.startedAt,
                  endsAt: data.session.endsAt,
                  remainingSeconds: data.session.remainingSeconds,
                });
              } else {
                setCurrentSession(null);
              }
              break;
            case 'focusStarted':
              setFocusState('FOCUSING');
              setCurrentSession({
                destination: data.destination,
                url: data.destination.toLowerCase() === 'codeforces' ? 'https://codeforces.com/' : `https://${data.destination}`,
                durationMinutes: data.durationMin,
                startTime: data.startedAt,
                endsAt: data.endsAt,
                remainingSeconds: data.durationMin * 60,
              });
              break;
            case 'focusEnded':
              setFocusState('IDLE');
              setCurrentSession(null);
              break;
            case 'error':
              setLastError(data.message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse event from agent:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };

      ws.onclose = () => {
        setConnectionStatus('DISCONNECTED');
        socketRef.current = null;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err) {
      setConnectionStatus('DISCONNECTED');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const startFocus = useCallback(
    (destination: string, durationMinutes: number) => {
      sendMessage({
        type: 'enterFocus',
        durationMin: durationMinutes,
        destination,
      });
    },
    [sendMessage]
  );

  const exitFocus = useCallback(() => {
    sendMessage({ type: 'exitFocus' });
  }, [sendMessage]);

  return {
    connectionStatus,
    focusState,
    currentSession,
    lastError,
    startFocus,
    exitFocus,
    retryConnect: connect,
  };
}
