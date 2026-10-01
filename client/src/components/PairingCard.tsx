// import React, { useState } from 'react';
// import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

// interface PairingCardProps {
//   onPair: (code: string) => void;
//   errorMessage?: string | null;
// }

// export const PairingCard: React.FC<PairingCardProps> = ({ onPair, errorMessage }) => {
//   const [code, setCode] = useState('');

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (code.trim().length === 6) {
//       onPair(code.trim());
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto px-6 py-12">
//       <div className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6 text-center">
//         <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 mx-auto flex items-center justify-center">
//           <KeyRound className="w-7 h-7" />
//         </div>

//         <div className="space-y-2">
//           <h3 className="text-2xl font-black text-white">Connect your Focus Agent</h3>
//           <p className="text-xs text-slate-400 leading-relaxed">
//             Enter the 6-digit pairing code shown in your desktop agent system tray menu to pair your local focus environment.
//           </p>
//         </div>

//         {errorMessage && (
//           <div className="bg-rose-950/60 border border-rose-700/80 p-3.5 rounded-xl text-rose-200 text-xs flex items-center space-x-2 text-left">
//             <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
//             <span>{errorMessage}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <input
//               type="text"
//               maxLength={6}
//               value={code}
//               onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
//               placeholder="e.g. 483921"
//               className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-slate-950 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:text-xl"
//               autoFocus
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={code.trim().length !== 6}
//             className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//           >
//             <span>Connect</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </form>

//         <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
//           Pairing is explicit and single-use for your local machine security.
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

interface PairingCardProps {
  onPair: (code: string) => void;
  errorMessage?: string | null;
}

export const PairingCard: React.FC<PairingCardProps> = ({ onPair, errorMessage }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      onPair(code.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 mx-auto flex items-center justify-center">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white">Connect your Focus Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter the 6-digit pairing code shown in your desktop agent system tray menu to pair your local focus environment.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="bg-rose-950/60 border border-rose-700/80 p-3.5 rounded-xl text-rose-200 text-xs flex items-center space-x-2 text-left"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pairing-code" className="sr-only">
              6-digit pairing code
            </label>
            <input
              id="pairing-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 483921"
              aria-label="6-digit pairing code"
              className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-slate-950 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:text-xl"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={code.trim().length !== 6}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Connect</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          Pairing is explicit and single-use for your local machine security.
        </div>
      </div>
    </div>
  );
};