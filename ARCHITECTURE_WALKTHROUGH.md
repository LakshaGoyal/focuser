# Focuser - Architectural Walkthrough & System Specification

## 📌 Executive Summary

**Focuser** is a Windows-first desktop/web focus enforcement application designed to eliminate digital distractions and enforce deep work sessions (e.g. studying on Codeforces).

The project uses a **decoupled monorepo architecture**:
- **Client (React / Vite / Tailwind CSS)**: Web interface consuming `AgentClient` to auto-connect, handle explicit 6-digit pairing, process Start/Exit focus workflows, and display live countdowns.
- **Agent (Electron / Node.js / TypeScript)**: Local desktop agent running in the Windows System Tray that manages Win32 window state, maintains authoritative session timers, and enforces focus rules.
- **Protocol (Localhost WebSocket on `127.0.0.1:4545`)**: Strict, validated communication bridge connecting the browser to the local Electron agent.

---

## 🏗️ System Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                           BROWSER (Client)                              |
|  React 19 + Vite + TypeScript + Tailwind CSS                            |
|                                                                         |
|  +---------------------+   +---------------------+  +-----------------+ |
|  |   Navbar Component  |   |   PairingCard       |  |   ActiveFocus   | |
|  | (🟢 Connected Badges)|  | (6-digit Code Input)| | (Live Countdown)| |
|  +---------------------+   +---------------------+  +-----------------+ |
|                            |                                            |
|                            v                                            |
|                    +---------------+                                    |
|                    |  AgentClient  | (Dedicated Client Service)         |
|                    +---------------+                                    |
|                    - connect() / disconnect()                           |
|                    - getState() / pair(code)                            |
|                    - startFocus(options) / exitFocus()                  |
|                    - subscribeToState() / subscribeToEvents()           |
+----------------------------|--------------------------------------------+
                             |
                   WebSocket | JSON Protocol
             (Localhost ONLY | 127.0.0.1:4545)
                             v
+-------------------------------------------------------------------------+
|                        ELECTRON AGENT (Desktop)                         |
|  Node.js + Electron 34 + TypeScript                                     |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 AgentWebSocketServer (127.0.0.1:4545)             |  |
|  +-------------------------------------------------------------------+  |
|                                    |                                    |
|         +--------------------------+--------------------------+         |
|         v                          v                          v         |
|  +--------------+          +---------------+          +--------------+  |
|  |PairingManager|          |ProtocolValidat|          |RecoveryManage|  |
|  |(6-digit Code)|          |(Schema Checks)|          |(Crash Persistence|
|  +--------------+          +---------------+          +--------------+  |
|         |                          |                          |         |
|         +--------------------------+--------------------------+         |
|                                    v                                    |
|             +----------------------+----------------------+             |
|             v                                             v             |
|  +---------------------+                       +---------------------+  |
|  |    StateManager     |                       |  IFocusController   |  |
|  | (Authoritative Timer|                       | (WindowsController) |  |
|  |  startedAt/endsAt)  |                       | (WindowStateManager)|  |
|  +---------------------+                       +---------------------+  |
|             |                                             |             |
|             +----------------------+----------------------+             |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  |                           AgentTray                               |  |
|  |   - Windows System Tray icon & status context menu                |  |
|  |   - Displays 6-digit pairing code & Emergency Exit Focus option   |  |
|  +-------------------------------------------------------------------+  |
|                                    |                                    |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  |                       WINDOWS DESKTOP OS                          |  |
|  |   - Validates "codeforces" -> https://codeforces.com/             |  |
|  |   - Safe OS-level shell.openExternal launch in default browser   |  |
|  |   - Minimizes non-protected application windows (User32.dll)    |  |
|  |   - Preserves Codeforces, Focuser Agent, and Windows System apps   |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 🎯 Implementation Phases 6–9 Detailed Breakdown

### Phase 6 — Windows FocusController
- **Protected Windows**: Codeforces browser window, Focuser Electron Agent, and Windows system-critical windows (Taskbar, Program Manager, Start menu, Action Center, Task Manager) are identified by `ProtectedAppsManager` and preserved.
- **Distracting Windows**: Visible user application windows are enumerated via Win32 `User32.dll` (`EnumWindows`, `IsWindowVisible`, `GetWindowText`). Non-protected application handles are temporarily minimized using `ShowWindowAsync(hWnd, SW_MINIMIZE)`.
- **Restoration**: On `exitFocus()`, original handles are restored via `ShowWindowAsync(hWnd, SW_RESTORE)`.
- **Safety**: Applications are **NEVER** terminated or closed.

### Phase 7 — Authoritative Agent Countdown
- **Source of Truth**: The Electron agent generates authoritative `startedAt` and `endsAt` Unix timestamps (`Date.now() + durationMin * 60 * 1000`).
- **Automatic Expiration**: An internal timer loop checks `Date.now() >= endsAt`. When expired, the agent automatically triggers `exitFocus()`, restores desktop state, and emits `focusEnded`.
- **Browser Independence**: Survives browser refresh, tab closing/reopening, or socket disconnects. The React client reconstructs remaining time using `Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))`.

### Phase 8 — Explicit Local Agent Pairing
- **6-Digit Pairing Code**: When unpaired, the agent generates a cryptographically random 6-digit integer (e.g. `768290`) displayed in the Agent System Tray context menu.
- **Pairing Requirement**: WebSocket commands (`enterFocus`) require the socket connection to be paired. Submitting `{ "type": "pair", "code": "768290" }` validates the code and persists a token in `userData/pairing.json`.

### Phase 9 — Fail-Safe Recovery
- **Crash Persistence**: Active session state (`userData/active-session.json`) and modified window handles (`userData/window-state.json`) are persisted locally.
- **Startup & Sleep Reconciliation**: On agent boot or sleep resume (`powerMonitor.on('resume')`), the agent checks if an unfinished session exists. If expired, it automatically restores the desktop window layout and clears temporary files.

---

## 💻 Step-by-Step Executable Commands

### Build Verification
From the root `focuser/` folder:
```bash
npm run build
```
*(Executes `npm run build:client` and `npm run build:agent` in sequence. Both compile with 0 errors).*

### Running the Application

#### Terminal 1: Start the Desktop Electron Agent
```bash
cd agent
npm run dev
```

#### Terminal 2: Start the Web Dashboard
```bash
cd client
npm run dev
```
*(Open `http://localhost:5173` to test pairing, Codeforces focus destination, and window management).*
