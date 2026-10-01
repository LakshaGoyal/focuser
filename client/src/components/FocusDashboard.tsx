// import React, { useState } from 'react';
// import { Code2, Clock, Play, AlertTriangle, ExternalLink, AlertCircle, WifiOff } from 'lucide-react';
// import type { AgentConnectionStatus } from '../types/agent';

// interface FocusDashboardProps {
//   connectionStatus: AgentConnectionStatus;
//   onStartFocus: (destination: string, durationMin: number) => void;
//   errorMessage?: string | null;
//   onClearError?: () => void;
// }

// const DESTINATIONS = [
//   {
//     id: 'codeforces',
//     name: 'Codeforces',
//     description: 'Competitive programming platform & problem sets',
//     url: 'https://codeforces.com',
//     icon: Code2,
//   },
// ];

// const DURATIONS = [
//   { label: '30 min', value: 30 },
//   { label: '60 min', value: 60 },
//   { label: '90 min', value: 90 },
// ];

// export const FocusDashboard: React.FC<FocusDashboardProps> = ({
//   connectionStatus,
//   onStartFocus,
//   errorMessage,
//   onClearError,
// }) => {
//   const [selectedDestination] = useState(DESTINATIONS[0]);
//   const [durationMinutes, setDurationMinutes] = useState(30);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);

//   const isConnected = connectionStatus === 'CONNECTED';

//   const handleInitiate = () => {
//     setShowConfirmModal(true);
//   };

//   const handleConfirmStart = () => {
//     setShowConfirmModal(false);
//     onStartFocus(selectedDestination.name, durationMinutes);
//   };

//   return (
//     <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
//       {/* Title & Banner */}
//       <div className="text-center space-y-2">
//         <h2 className="text-4xl font-black tracking-tight text-white uppercase">
//           Focuser
//         </h2>
//         <p className="text-slate-400 text-base max-w-md mx-auto">
//           Your distraction-free workspace.
//         </p>
//       </div>

//       {/* Error Banner */}
//       {errorMessage && (
//         <div className="bg-rose-950/60 border border-rose-700/80 p-4 rounded-2xl flex items-start justify-between space-x-3 text-rose-200 text-sm animate-in fade-in">
//           <div className="flex items-start space-x-3">
//             <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
//             <div>
//               <span className="font-bold text-rose-100 block">Agent Error</span>
//               {errorMessage}
//             </div>
//           </div>
//           {onClearError && (
//             <button
//               onClick={onClearError}
//               className="text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 px-2.5 py-1 rounded-lg border border-rose-700/50 transition-colors"
//             >
//               Dismiss
//             </button>
//           )}
//         </div>
//       )}

//       {/* Agent Not Running Banner */}
//       {!isConnected && (
//         <div className="bg-rose-950/30 border border-rose-800/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-rose-200">
//           <div className="flex items-center space-x-4">
//             <div className="p-3 bg-rose-900/40 rounded-xl border border-rose-700/40 text-rose-400 shrink-0">
//               <WifiOff className="w-6 h-6" />
//             </div>
//             <div>
//               <h3 className="font-bold text-white text-base">🔴 Agent Not Running</h3>
//               <p className="text-xs text-rose-300/80 mt-0.5">
//                 Focuser requires the desktop agent running locally on <code className="bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800/50">ws://127.0.0.1:4545</code>. Run <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded">npm run dev</code> in the agent folder.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Card */}
//       <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8">
//         {/* Destination Section */}
//         <div className="space-y-3">
//           <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
//             Focus Destination
//           </label>

//           <div className="grid grid-cols-1 gap-4">
//             {DESTINATIONS.map((dest) => {
//               const Icon = dest.icon;
//               return (
//                 <div
//                   key={dest.id}
//                   className="p-5 rounded-2xl border-2 bg-indigo-950/20 border-indigo-500/80 shadow-lg shadow-indigo-950/30 flex items-center justify-between"
//                 >
//                   <div className="flex items-center space-x-4">
//                     <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
//                       <Icon className="w-6 h-6" />
//                     </div>
//                     <div>
//                       <div className="flex items-center space-x-2">
//                         <h3 className="font-bold text-white text-base">{dest.name}</h3>
//                         <a
//                           href={dest.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
//                         >
//                           {dest.url} <ExternalLink className="w-3 h-3" />
//                         </a>
//                       </div>
//                       <p className="text-xs text-slate-400 mt-0.5">{dest.description}</p>
//                     </div>
//                   </div>

//                   <span className="text-xs bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold px-3 py-1 rounded-full">
//                     Selected
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Duration Selection */}
//         <div className="space-y-3">
//           <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
//             Duration
//           </label>

//           <div className="grid grid-cols-3 gap-3">
//             {DURATIONS.map((dur) => (
//               <button
//                 key={dur.value}
//                 onClick={() => setDurationMinutes(dur.value)}
//                 className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
//                   durationMinutes === dur.value
//                     ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/50'
//                     : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
//                 }`}
//               >
//                 <Clock className={`w-5 h-5 ${durationMinutes === dur.value ? 'text-indigo-400' : 'text-slate-400'}`} />
//                 <span className="font-bold text-sm">{dur.label}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Primary Action Button */}
//         <div className="pt-2 border-t border-slate-800/80">
//           <button
//             onClick={handleInitiate}
//             disabled={!isConnected}
//             className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center space-x-2.5 transition-all ${
//               isConnected
//                 ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
//                 : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
//             }`}
//           >
//             <Play className="w-5 h-5 fill-current" />
//             <span>Start Focus</span>
//           </button>
//         </div>
//       </div>

//       {/* Confirmation Modal */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
//           <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
//             <div className="flex items-center space-x-3 text-amber-400">
//               <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
//                 <AlertTriangle className="w-6 h-6" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-bold text-white">Confirm Focus Session</h3>
//                 <span className="text-xs text-slate-400">Explicit confirmation required</span>
//               </div>
//             </div>

//             <div className="space-y-3 text-sm text-slate-300">
//               <p>
//                 Start a <strong className="text-indigo-400">{durationMinutes} min</strong> focus session targeting <strong className="text-indigo-400">{selectedDestination.name}</strong>?
//               </p>

//               <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
//                 <span className="font-semibold text-slate-300 block">Agent Execution Plan:</span>
//                 <ul className="list-disc list-inside space-y-1">
//                   <li>Sends enterFocus command over WebSocket (ws://127.0.0.1:4545)</li>
//                   <li>Agent opens Codeforces in default browser</li>
//                   <li>Agent activates focus environment protection</li>
//                 </ul>
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmStart}
//                 className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
//               >
//                 Confirm & Start
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };



import React, { useState } from 'react';
import {
  Code2,
  Clock,
  Play,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import type { AgentConnectionStatus } from '../types/agent';

interface FocusDashboardProps {
  connectionStatus: AgentConnectionStatus;
  onStartFocus: (destination: string, durationMin: number) => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

const DESTINATIONS = [
  {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Competitive programming platform & problem sets',
    url: 'https://codeforces.com',
    icon: Code2,
  },
];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

export const FocusDashboard: React.FC<FocusDashboardProps> = ({
  connectionStatus,
  onStartFocus,
  errorMessage,
  onClearError,
}) => {
  const [selectedDestination] = useState(DESTINATIONS[0]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isConnected = connectionStatus === 'CONNECTED';

  const handleInitiate = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmStart = () => {
    setShowConfirmModal(false);
    onStartFocus(selectedDestination.name, durationMinutes);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Title & Banner */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-white uppercase">
          Focuser
        </h2>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          Your distraction-free workspace.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-rose-950/60 border border-rose-700/80 p-4 rounded-2xl flex items-start justify-between space-x-3 text-rose-200 text-sm animate-in fade-in"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-100 block">
                Agent Error
              </span>
              {errorMessage}
            </div>
          </div>

          {onClearError && (
            <button
              onClick={onClearError}
              className="text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 px-2.5 py-1 rounded-lg border border-rose-700/50 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Agent Not Running Banner */}
      {!isConnected && (
        <div
          role="status"
          aria-live="polite"
          className="bg-rose-950/30 border border-rose-800/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-rose-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-900/40 rounded-xl border border-rose-700/40 text-rose-400 shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-white text-base">
                🔴 Agent Not Running
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Focuser requires the desktop agent running locally on{' '}
                <code className="bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800/50">
                  ws://127.0.0.1:4545
                </code>
                . Run{' '}
                <code className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded">
                  npm run dev
                </code>{' '}
                in the agent folder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8">
        {/* Destination Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Focus Destination
          </label>

          <div className="grid grid-cols-1 gap-4">
            {DESTINATIONS.map((dest) => {
              const Icon = dest.icon;

              return (
                <div
                  key={dest.id}
                  className="p-5 rounded-2xl border-2 bg-indigo-950/20 border-indigo-500/80 shadow-lg shadow-indigo-950/30 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">
                          {dest.name}
                        </h3>

                        <a
                          href={dest.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
                        >
                          {dest.url}{' '}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {dest.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold px-3 py-1 rounded-full">
                    Selected
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Duration
          </label>

          <div className="grid grid-cols-3 gap-3">
            {DURATIONS.map((dur) => (
              <button
                key={dur.value}
                onClick={() => setDurationMinutes(dur.value)}
                aria-pressed={durationMinutes === dur.value}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  durationMinutes === dur.value
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Clock
                  className={`w-5 h-5 ${
                    durationMinutes === dur.value
                      ? 'text-indigo-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="font-bold text-sm">{dur.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={handleInitiate}
            disabled={!isConnected}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center space-x-2.5 transition-all ${
              isConnected
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-confirmation-title"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3
                  id="focus-confirmation-title"
                  className="text-lg font-bold text-white"
                >
                  Confirm Focus Session
                </h3>
                <span className="text-xs text-slate-400">
                  Explicit confirmation required
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Start a{' '}
                <strong className="text-indigo-400">
                  {durationMinutes} min
                </strong>{' '}
                focus session targeting{' '}
                <strong className="text-indigo-400">
                  {selectedDestination.name}
                </strong>
                ?
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block">
                  Agent Execution Plan:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Sends enterFocus command over WebSocket
                    (ws://127.0.0.1:4545)
                  </li>
                  <li>Agent opens Codeforces in default browser</li>
                  <li>Agent activates focus environment protection</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmStart}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Confirm &amp; Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};