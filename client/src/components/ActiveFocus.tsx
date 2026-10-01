// import React, { useEffect, useState } from 'react';
// import { Shield, ExternalLink, Square, Loader2, CheckCircle2 } from 'lucide-react';
// import type { FocusSession, AgentConnectionStatus } from '../types/agent';

// interface ActiveFocusProps {
//   session: FocusSession | null;
//   connectionStatus: AgentConnectionStatus;
//   isEndingFocus: boolean;
//   showFocusEndedModal: boolean;
//   onExitFocus: () => void;
//   onDismissEndedModal: () => void;
// }

// export const ActiveFocus: React.FC<ActiveFocusProps> = ({
//   session,
//   connectionStatus,
//   isEndingFocus,
//   showFocusEndedModal,
//   onExitFocus,
//   onDismissEndedModal,
// }) => {
//   const [remainingSeconds, setRemainingSeconds] = useState<number>(
//     session?.remainingSeconds ?? (session?.durationMinutes ? session.durationMinutes * 60 : 1800)
//   );

//   useEffect(() => {
//     if (session?.remainingSeconds !== undefined) {
//       setRemainingSeconds(session.remainingSeconds);
//     }
//   }, [session?.remainingSeconds]);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const formatTime = (totalSeconds: number) => {
//     const mins = Math.floor(totalSeconds / 60);
//     const secs = totalSeconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const destinationName = session?.destination || 'Codeforces';
//   const destinationUrl = session?.url || 'https://codeforces.com';
//   const isConnected = connectionStatus === 'CONNECTED';

//   return (
//     <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
//       <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
//         <span className="relative flex h-2 w-2">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
//           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
//         </span>
//         <span>FOCUS MODE ACTIVE</span>
//       </div>

//       <div className="space-y-1">
//         <h2 className="text-3xl font-black text-white">{destinationName}</h2>
//         <a
//           href={destinationUrl}
//           target="_blank"
//           rel="noreferrer"
//           className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
//         >
//           {destinationUrl} <ExternalLink className="w-3 h-3" />
//         </a>
//       </div>

//       {/* Main Countdown Card */}
//       <div className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-6">
//         <div className="text-7xl md:text-8xl font-black font-mono tracking-wider bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-md">
//           {formatTime(remainingSeconds)}
//         </div>

//         <p className="text-slate-300 text-sm max-w-md font-medium">
//           Stay focused. Your distracting windows are temporarily stepped aside.
//         </p>

//         <div className="w-full max-w-sm bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
//           <div className="flex items-center space-x-2">
//             <Shield className="w-4 h-4 text-indigo-400" />
//             <span>Agent Connection:</span>
//           </div>
//           <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
//             {isConnected ? '🟢 Agent Connected' : '🔴 Agent Disconnected'}
//           </span>
//         </div>

//         {/* Exit Focus Button */}
//         <div className="w-full max-w-sm pt-2">
//           <button
//             onClick={onExitFocus}
//             disabled={isEndingFocus || !isConnected}
//             className="w-full py-4 px-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
//           >
//             {isEndingFocus ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
//                 <span>Exiting Focus Mode...</span>
//               </>
//             ) : (
//               <>
//                 <Square className="w-4 h-4 fill-current" />
//                 <span>Exit Focus</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Focus Ended Completion Modal */}
//       {showFocusEndedModal && (
//         <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center">
//             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 mx-auto flex items-center justify-center">
//               <CheckCircle2 className="w-7 h-7" />
//             </div>

//             <div className="space-y-2">
//               <h3 className="text-xl font-bold text-white">Focus Session Ended</h3>
//               <p className="text-sm text-slate-300">
//                 Your local Electron agent has restored your previous desktop layout. Great job staying focused on {destinationName}!
//               </p>
//             </div>

//             <button
//               onClick={onDismissEndedModal}
//               className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
//             >
//               Return to Dashboard
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };


import React, { useEffect, useState } from 'react';
import { Shield, ExternalLink, Square, Loader2, CheckCircle2 } from 'lucide-react';
import type { FocusSession, AgentConnectionStatus } from '../types/agent';

interface ActiveFocusProps {
  session: FocusSession | null;
  connectionStatus: AgentConnectionStatus;
  isEndingFocus: boolean;
  showFocusEndedModal: boolean;
  onExitFocus: () => void;
  onDismissEndedModal: () => void;
}

export const ActiveFocus: React.FC<ActiveFocusProps> = ({
  session,
  connectionStatus,
  isEndingFocus,
  showFocusEndedModal,
  onExitFocus,
  onDismissEndedModal,
}) => {
  const DEFAULT_FOCUS_DURATION_SECONDS = 30 * 60;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    session?.remainingSeconds ??
      (session?.durationMinutes
        ? session.durationMinutes * 60
        : DEFAULT_FOCUS_DURATION_SECONDS)
  );

  useEffect(() => {
    if (session?.remainingSeconds !== undefined) {
      setRemainingSeconds(session.remainingSeconds);
    }
  }, [session?.remainingSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const destinationName = session?.destination || 'Codeforces';
  const destinationUrl = session?.url || 'https://codeforces.com';
  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-center">
      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>FOCUS MODE ACTIVE</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white">{destinationName}</h2>
        <a
          href={destinationUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
        >
          {destinationUrl} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Countdown Card */}
      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-6">
        <div className="text-7xl md:text-8xl font-black font-mono tracking-wider bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-md">
          {formatTime(remainingSeconds)}
        </div>

        <p className="text-slate-300 text-sm max-w-md font-medium">
          Stay focused. Your distracting windows are temporarily stepped aside.
        </p>

        <div className="w-full max-w-sm bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Agent Connection:</span>
          </div>
          <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? '🟢 Agent Connected' : '🔴 Agent Disconnected'}
          </span>
        </div>

        {/* Exit Focus Button */}
        <div className="w-full max-w-sm pt-2">
          <button
            onClick={onExitFocus}
            disabled={isEndingFocus || !isConnected}
            className="w-full py-4 px-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isEndingFocus ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                <span>Exiting Focus Mode...</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Exit Focus</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Focus Ended Completion Modal */}
      {showFocusEndedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Focus Session Ended</h3>
              <p className="text-sm text-slate-300">
                Your local Electron agent has restored your previous desktop layout. Great job staying focused on {destinationName}!
              </p>
            </div>

            <button
              onClick={onDismissEndedModal}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};