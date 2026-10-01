import React from 'react';
import { Shield, RefreshCw, KeyRound, Check } from 'lucide-react';
import type { AgentConnectionStatus } from '../types/agent';

interface NavbarProps {
  connectionStatus: AgentConnectionStatus;
  isPaired: boolean;
  onRetry: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ connectionStatus, isPaired, onRetry }) => {
  const isConnected = connectionStatus === 'CONNECTED';
  const isConnecting = connectionStatus === 'CONNECTING';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase leading-none">
              Focuser
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Your distraction-free workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : isConnecting
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            <span>
              {isConnected
                ? '🟢 Agent Connected'
                : isConnecting
                ? '🟡 Connecting to Agent...'
                : '🔴 Agent Not Running'}
            </span>

            {!isConnected && (
              <button
                onClick={onRetry}
                className="ml-1 text-slate-400 hover:text-white transition-colors"
                title="Retry Connection to 127.0.0.1:4545"
                aria-label="Retry connection"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Pairing Status Badge */}
          {isConnected && (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isPaired
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
              }`}
            >
              {isPaired ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <KeyRound className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPaired ? 'Paired' : 'Unpaired'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
