import { Navbar } from './components/Navbar';
import { PairingCard } from './components/PairingCard';
import { FocusDashboard } from './components/FocusDashboard';
import { ActiveFocus } from './components/ActiveFocus';
import { useAgent } from './hooks/useAgent';

export function App() {
  const {
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
  } = useAgent();

  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar
        connectionStatus={connectionStatus}
        isPaired={isPaired}
        onRetry={retryConnect}
      />

      <main className="flex-1 flex flex-col justify-center">
        {isConnected && !isPaired ? (
          <PairingCard onPair={pairAgent} errorMessage={errorMessage} />
        ) : focusState === 'FOCUSING' ? (
          <ActiveFocus
            session={currentSession}
            connectionStatus={connectionStatus}
            isEndingFocus={isEndingFocus}
            showFocusEndedModal={showFocusEndedModal}
            onExitFocus={exitFocus}
            onDismissEndedModal={dismissFocusEndedModal}
          />
        ) : (
          <FocusDashboard
            connectionStatus={connectionStatus}
            onStartFocus={startFocus}
            errorMessage={errorMessage}
            onClearError={clearError}
          />
        )}
      </main>

      <footer className="border-t border-slate-900/80 py-4 text-center text-xs text-slate-500">
        Focuser Desktop Agent Architecture • Localhost Bridge <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-400">ws://127.0.0.1:4545</code>
      </footer>
    </div>
  );
}

export default App;
