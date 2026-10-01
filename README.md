# Focuser

Focuser pairs a web dashboard with a local Windows Electron agent. The dashboard requests focus sessions; only the installed local agent performs Windows window management.

## Architecture

```text
Website
  ↓ WebSocket (127.0.0.1:4545)
Electron Focus Agent
  ↓
Windows OS
```

The website never controls Windows directly. The local agent owns the focus session, minimizes/restores windows, and opens the dedicated Codeforces focus workspace.

## Features

- Local Electron Focus Agent
- Windows focus mode and application minimization
- Dedicated Codeforces focus window
- Fullscreen/kiosk focus behavior
- Local focus-session control over `ws://127.0.0.1:4545`
- Tray Exit Focus and desktop restoration

## Development

Requires Node.js 20 or later and Windows 10/11 for agent functionality.

```powershell
npm install
npm run dev
```

`npm run dev` starts the Vite website and local Electron agent. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

To run only the agent:

```powershell
npm run dev:agent
```

The website reads `VITE_AGENT_WS_URL`; copy `.env.example` to `.env.local` only if a different local endpoint is needed. The default remains `ws://127.0.0.1:4545`.

## Build the Windows installer

```powershell
npm install
npm run dist
```

Artifacts are written to `agent/release/`:

- `Focuser-Setup-1.0.0.exe` — per-user NSIS installer with a Start Menu shortcut
- `Focuser-Portable-1.0.0.exe` — portable build

The installed app includes Electron, the compiled agent, dependencies, and the Windows PowerShell helper. Node.js, npm, Git, VS Code, and this repository are not needed after installation.

## User installation

1. Download `Focuser-Setup-1.0.0.exe` from a release or build artifact.
2. Run the installer and launch Focuser from the Start Menu.
3. Open the Focuser website.
4. Start Focus from the website.
5. Use **Exit Focus** from the Focuser tray menu to restore the desktop in an emergency.

## Packaging notes

The agent binds only to `127.0.0.1:4545`; it does not expose its WebSocket server to the network. GitHub Actions packages Windows artifacts, but local packaging remains available through `npm run dist`.
