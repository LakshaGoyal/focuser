import { useEffect, useState, useCallback } from 'react';
import { agentClient } from '../services/AgentClient';
import type {
  AgentConnectionStatus,
  AgentEvent,
  FocusModeState,
  FocusSession,
} from '../types/agent';

export function useAgent() {
  const [connectionStatus, setConnectionStatus] = useState<AgentConnectionStatus>(
    agentClient.getConnectionStatus()
  );
  const [isPaired, setIsPaired] = useState<boolean>(agentClient.isPaired());
  const [focusState, setFocusState] = useState<FocusModeState>(
    agentClient.getFocusState()
  );
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(
    agentClient.getCurrentSession()
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFocusEndedModal, setShowFocusEndedModal] = useState<boolean>(false);
  const [isEndingFocus, setIsEndingFocus] = useState<boolean>(false);

  useEffect(() => {
    agentClient.connect();

    const unsubStatus = agentClient.subscribeToStatus((status) => {
      setConnectionStatus(status);
      if (status === 'DISCONNECTED') {
        setIsEndingFocus(false);
      }
    });

    const unsubPairing = agentClient.subscribeToPairing((paired) => {
      setIsPaired(paired);
    });

    const unsubState = agentClient.subscribeToState((state, session) => {
      setFocusState(state);
      setCurrentSession(session);
      if (state === 'IDLE' && isEndingFocus) {
        setIsEndingFocus(false);
      }
    });

    const unsubEvents = agentClient.subscribeToEvents((event: AgentEvent) => {
      if (event.type === 'focusEnded') {
        setIsEndingFocus(false);
        setShowFocusEndedModal(true);
      } else if (event.type === 'error') {
        setIsEndingFocus(false);
        setErrorMessage(event.message);
      } else if (event.type === 'focusStarted') {
        setErrorMessage(null);
      }
    });

    return () => {
      unsubStatus();
      unsubPairing();
      unsubState();
      unsubEvents();
    };
  }, [isEndingFocus]);

  const pairAgent = useCallback((code: string) => {
    setErrorMessage(null);
    agentClient.pair(code);
  }, []);

  const startFocus = useCallback((destination: string, durationMin: number) => {
    setErrorMessage(null);
    agentClient.startFocus({ destination, durationMin });
  }, []);

  const exitFocus = useCallback(() => {
    setIsEndingFocus(true);
    agentClient.exitFocus();
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const dismissFocusEndedModal = useCallback(() => {
    setShowFocusEndedModal(false);
  }, []);

  const retryConnect = useCallback(() => {
    agentClient.connect();
  }, []);

  return {
    connectionStatus,
    isPaired,
    focusState,
    currentSession,
    errorMessage,
    isEndingFocus,
    showFocusEndedModal,
    pairAgent,
    startFocus,
    exitFocus,
    clearError,
    dismissFocusEndedModal,
    retryConnect,
  };
}
