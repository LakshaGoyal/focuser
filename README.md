# Focuser

> A Windows Focus Mode application that combines a web dashboard with a local Electron desktop agent to create a controlled, distraction-free workspace.

Focuser is designed around a simple principle:

**The web dashboard controls the focus session, while the local Windows agent performs the actual desktop-level operations.**

The website never directly controls Windows applications. Instead, it communicates with the locally installed Focuser Electron agent through a localhost WebSocket connection. The desktop agent is responsible for window management, the dedicated focus workspace, kiosk behavior, restoration, and emergency exit.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [System Workflow](#system-workflow)
- [Focus Mode Workflow](#focus-mode-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Building the Windows Application](#building-the-windows-application)
- [Installing Focuser](#installing-focuser)
- [How Focus Mode Works](#how-focus-mode-works)
- [Windows Window Management](#windows-window-management)
- [Safety and Recovery](#safety-and-recovery)
- [Contributor Workflow](#contributor-workflow)
- [Contributors](#contributors)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Project Status](#project-status)
- [License](#license)

---

<a id="overview"></a>
## Overview
Focuser consists of two major components:

1. **Web Dashboard**
   - Provides the user interface.
   - Allows users to start and end focus sessions.
   - Communicates with the local desktop agent.

2. **Local Windows Electron Agent**
   - Runs directly on the user's Windows machine.
   - Receives focus commands from the web dashboard.
   - Manages Windows application windows.
   - Minimizes distracting applications.
   - Opens the dedicated Codeforces focus workspace.
   - Provides fullscreen/kiosk focus behavior.
   - Restores the previous desktop state when Focus Mode ends.
   - Provides an emergency Exit Focus option through the system tray.

The architecture intentionally separates web functionality from operating-system functionality.

---

<a id="key-features"></a>
## Key Features
### Focus Session Control

Users can start and stop a Focus Session from the web dashboard.

The dashboard communicates with the local Focuser agent through:

```text
ws://127.0.0.1:4545
````

### Windows Focus Mode

During a focus session, Focuser can:

- Detect visible application windows.
- Preserve protected applications and system windows.
- Minimize distracting applications.
- Preserve the previous desktop state.
- Restore affected applications when Focus Mode ends.

Applications are minimized rather than terminated.

### Dedicated Codeforces Workspace

For Codeforces focus sessions, Focuser creates a dedicated Electron `BrowserWindow`.

The Codeforces website is loaded inside the Focuser desktop application instead of opening the user's normal Chrome or Edge window.

The dedicated focus window supports:

- Fullscreen behavior.
- Kiosk behavior.
- Hidden menu bar.
- Always-on-top behavior.
- Dedicated application-level window management.

### Local Desktop Agent

The Electron agent runs locally and exposes a localhost-only WebSocket server:

```text
127.0.0.1:4545
```

The agent performs the Windows-specific operations that a normal browser cannot safely perform.

### System Tray

Focuser provides a Windows system-tray interface.

The tray allows the user to access desktop-agent controls, including an emergency **Exit Focus** action.

### Desktop Restoration

Before entering Focus Mode, Focuser records the relevant desktop window state.

When Focus Mode ends:

```text
Exit Focus
    ↓
Close Focus Window
    ↓
Clear Dynamic Protections
    ↓
Restore Previous Window State
    ↓
Clear Focus State
    ↓
Normal Desktop
```

---

<a id="architecture"></a>
## Architecture
```text
┌──────────────────────────────┐
│        Focuser Website       │
│          React / Vite        │
└──────────────┬───────────────┘
               │
               │ WebSocket
               │ 127.0.0.1:4545
               ▼
┌──────────────────────────────┐
│     Focuser Desktop Agent    │
│           Electron           │
├──────────────────────────────┤
│ Local WebSocket Server       │
│ Focus Controller             │
│ Windows Focus Controller     │
│ Window State Manager         │
│ Recovery Manager             │
│ Tray Integration             │
└──────────────┬───────────────┘
               │
               │ Windows APIs /
               │ PowerShell helper
               ▼
┌──────────────────────────────┐
│          Windows OS          │
├──────────────────────────────┤
│ Application Windows          │
│ Window Visibility            │
│ Window Minimization          │
│ Window Restoration           │
└──────────────────────────────┘
```

### Core Architecture Principle

The website **does not directly control Windows**.

Instead:

```text
Website
   ↓
Local WebSocket
   ↓
Electron Agent
   ↓
Windows OS
```

This separation keeps browser functionality and desktop functionality independent.

---

<a id="system-workflow"></a>
## System Workflow
### 1. Open the Website

The user opens the Focuser web dashboard.

```text
Browser
   ↓
Focuser Website
```

### 2. Connect to the Local Agent

The website connects to:

```text
ws://127.0.0.1:4545
```

The local Electron agent accepts the WebSocket connection.

### 3. Start a Focus Session

The user selects the desired focus destination and duration and starts the session.

The website sends a focus command to the local agent:

```text
Website
   ↓
WebSocket
   ↓
Focuser Agent
```

### 4. Agent Enters Focus Mode

The agent:

1. Receives the focus command.
2. Validates the destination.
3. Detects the required focus workspace.
4. Captures the current Windows window state.
5. Identifies protected windows.
6. Minimizes distracting windows.
7. Opens the dedicated focus workspace.
8. Activates Focus Mode.
9. Persists the active session state for recovery.

### 5. User Works

For a Codeforces session:

```text
Focuser Electron Window
        ↓
https://codeforces.com/
```

The Codeforces page runs inside the dedicated Focuser window.

Normal desktop applications remain minimized during the focus session.

### 6. Exit Focus

When Focus Mode ends:

```text
Exit Focus
    ↓
Close Dedicated Focus Window
    ↓
Clear Dynamic Protections
    ↓
Restore Previous Windows
    ↓
Clear Active Session State
    ↓
Normal Desktop
```

---

<a id="focus-mode-workflow"></a>
## Focus Mode Workflow
```text
              START
                │
                ▼
       User starts Focus
                │
                ▼
       Website sends command
                │
                ▼
        Local Agent receives
                │
                ▼
        Validate destination
                │
                ▼
        Capture window state
                │
                ▼
        Identify protected
             windows
                │
                ▼
       Minimize distractions
                │
                ▼
     Create dedicated Electron
           focus window
                │
                ▼
        Load Codeforces
                │
                ▼
        Fullscreen / Kiosk
                │
                ▼
         Focus Mode Active
                │
                ▼
           User works
                │
                ▼
          Exit Focus
                │
                ▼
       Close focus window
                │
                ▼
       Restore desktop state
                │
                ▼
               END
```

---

<a id="technology-stack"></a>
## Technology Stack
### Frontend

- React
- Vite
- TypeScript
- WebSocket

### Desktop Agent

- Electron
- Node.js
- TypeScript

### Windows Integration

- Windows APIs
- PowerShell
- Windows window handles
- Application/window enumeration
- Window minimization and restoration

### Build and Packaging

- Electron Builder
- NSIS Windows installer
- Portable Windows executable

### Development Tools

- VS Code
- Antigravity
- Git
- GitHub
- npm

---

<a id="project-structure"></a>
## Project Structure
```text
focuser/
│
├── agent/
│   ├── src/
│   │   ├── focus/
│   │   │   ├── FocusController.ts
│   │   │   ├── WindowsFocusController.ts
│   │   │   ├── WindowState.ts
│   │   │   └── ...
│   │   │
│   │   ├── tray/
│   │   ├── main.ts
│   │   └── ...
│   │
│   ├── package.json
│   └── release/
│
├── client/
│   └── ...
│
├── resources/
│
├── docs/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── package.json
├── README.md
└── ...
```

---

<a id="local-development"></a>
## Local Development
### Requirements

Development requires:

- Windows 10 or Windows 11.
- Node.js 20 or later.
- npm.
- Git.
- A modern web browser.
- VS Code or another compatible editor.

Windows is required for testing the desktop window-management functionality.

### Clone the Repository

```powershell
git clone https://github.com/LakshaGoyal/focuser.git
cd focuser
```

### Install Dependencies

```powershell
npm install
```

### Start Development Environment

```powershell
npm run dev
```

This starts the development environment for the website and local Electron agent.

The Vite development server normally runs at:

```text
http://localhost:5173
```

The local Focuser agent listens on:

```text
ws://127.0.0.1:4545
```

The exact development URL is displayed in the terminal.

### Run Only the Agent

```powershell
npm run dev:agent
```

The agent should report that it is ready on:

```text
ws://127.0.0.1:4545
```

---

<a id="environment-configuration"></a>
## Environment Configuration
The example environment configuration is provided in:

```text
.env.example
```

If a different local WebSocket endpoint is required, create:

```text
.env.local
```

and configure:

```env
VITE_AGENT_WS_URL=ws://127.0.0.1:4545
```

The default endpoint is:

```text
ws://127.0.0.1:4545
```

Do not commit private API keys, tokens, passwords, or other secrets.

---

<a id="building-the-windows-application"></a>
## Building the Windows Application
The Electron application can be packaged into Windows executables using Electron Builder.

From the project root:

```powershell
npm install
npm run dist
```

Build artifacts are generated under:

```text
agent/release/
```

Typical artifacts include:

```text
Focuser-Setup-1.0.0.exe
Focuser-Portable-1.0.0.exe
```

### Windows Installer

`Focuser-Setup-1.0.0.exe` is the standard Windows installation package.

The installed application includes:

- Electron runtime.
- Compiled Focuser agent.
- Required dependencies.
- Windows helper resources.

After installation, users do not need:

- Node.js.
- npm.
- Git.
- VS Code.
- The Focuser source repository.

to run the installed desktop agent.

### Portable Version

`Focuser-Portable-1.0.0.exe` provides a portable build that can be used without a traditional installation process.

The installer version is recommended for normal users.

---

<a id="installing-focuser"></a>
## Installing Focuser
1. Download the latest Focuser Windows installer.
2. Run:

```text
Focuser-Setup-1.0.0.exe
```

3. Complete the installation.
4. Launch Focuser.
5. Open the Focuser web dashboard.
6. Allow the website to connect to the local Focuser agent.
7. Start a Focus Session.
8. Select the desired focus destination.
9. Use Focus Mode.
10. Exit Focus when finished.

The Focuser system tray provides an emergency **Exit Focus** option.

---

<a id="how-focus-mode-works"></a>
## How Focus Mode Works
When a focus session starts, Focuser captures the current desktop state before making changes.

The agent then determines which windows should remain visible and which should be minimized.

### Protected Windows

Protected windows are not minimized during Focus Mode.

Protection can be based on:

- Application/process name.
- Window title.
- Window handle.
- Dynamically registered focus windows.

### Distracting Windows

Windows that are not protected can be minimized during the focus session.

Applications are not terminated.

### Focus Workspace

For Codeforces, Focuser creates a dedicated Electron window:

```text
Electron BrowserWindow
        ↓
https://codeforces.com/
```

This separates the focus workspace from normal browser sessions.

---

<a id="windows-window-management"></a>
## Windows Window Management
Focuser uses a dedicated Windows Focus Controller to manage desktop windows.

The controller can:

- Enumerate visible windows.
- Identify application processes.
- Detect window titles.
- Protect specific windows.
- Minimize distracting windows.
- Restore previously affected windows.

### Protected Applications

The protected application rules include system and Focuser-related windows such as:

```text
focuser
electron
program manager
start
taskbar
windows input experience
system settings
task manager
windows shell experience host
action center
notification center
```

### Dynamic Protection

Specific windows can be protected dynamically using:

- Window handles.
- Title patterns.

For example, the dedicated Codeforces focus window can be registered as a dynamically protected window.

Dynamic protections are cleared when Focus Mode ends.

---

<a id="safety-and-recovery"></a>
## Safety and Recovery
Focuser is designed to minimize applications rather than terminate them.

Before Focus Mode:

```text
Current Desktop
      ↓
Capture Window State
      ↓
Start Focus
```

After Focus Mode:

```text
Exit Focus
      ↓
Close Dedicated Focus Window
      ↓
Restore Previous Window State
      ↓
Normal Desktop
```

The active focus-session state is also persisted for fail-safe recovery.

### Emergency Exit

If the website becomes unavailable during a focus session, the Focuser system tray provides an emergency **Exit Focus** action.

---

<a id="contributor-workflow"></a>
## Contributor Workflow
Focuser uses a branch-based Git workflow.

Contributors should **not directly modify `main`**.

Recommended structure:

```text
main
 │
 ├── feature/member-1
 ├── feature/member-2
 ├── feature/member-3
 └── feature/member-4
```

### 1. Clone the Repository

```powershell
git clone https://github.com/LakshaGoyal/focuser.git
cd focuser
```

### 2. Create a Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/my-change
```

### 3. Make the Change

Keep the change focused on the assigned task.

### 4. Test the Change

Run the relevant application or tests before creating the Pull Request.

### 5. Commit

Use a clear commit message:

```powershell
git add .
git commit -m "docs: improve installation guide"
```

### 6. Push the Branch

```powershell
git push -u origin feature/my-change
```

### 7. Create a Pull Request

Create a Pull Request from:

```text
feature/my-change
        ↓
      main
```

### 8. Review

Changes should be reviewed before they are merged into `main`.

This keeps the stable branch protected while allowing contributors to work independently.

---

<a id="contributors"></a>
## Contributors
Focuser is developed collaboratively by:

| Contributor         | Role                     |
| ------------------- | ------------------------ |
| **Laksha Goyal**    | Project Lead / Developer |
| **Kritika Kanchan** | Contributor              |
| **Krishna Gopal**   | Contributor              |
| **Laxmi**           | Contributor              |
| **Madhav Garg**     | Contributor              |

Contributors work through Git branches and Pull Requests to keep the main project stable.

---

<a id="troubleshooting"></a>
## Troubleshooting
### Agent Does Not Start

Check whether another Focuser process is already running:

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*Focuser*"}
```

If an old development instance is running, close it before starting another instance.

### Port 4545 Is Already in Use

Check the port:

```powershell
Get-NetTCPConnection -LocalPort 4545 -ErrorAction SilentlyContinue
```

If another Focuser process is using the port, close the existing agent before starting another instance.

### Website Cannot Connect to the Agent

Verify that the agent reports:

```text
ws://127.0.0.1:4545
```

Also verify that the website is configured to use:

```text
ws://127.0.0.1:4545
```

### Codeforces Opens in the Wrong Browser

Codeforces Focus Mode is designed to open Codeforces inside the dedicated Electron focus workspace.

If Codeforces opens in the normal browser instead, verify that the current Focuser agent build is running and that the dedicated focus-window implementation is being used.

### Windows Are Not Restored

Use the Focuser system tray's **Exit Focus** option.

The focus agent maintains the state required for restoration and recovery.

---

<a id="security-notes"></a>
## Security Notes
The Focuser desktop agent binds only to:

```text
127.0.0.1:4545
```

It is not intended to expose its WebSocket server to other devices on the network.

The website communicates with the local desktop agent through localhost.

Do not commit:

- API keys.
- Access tokens.
- Passwords.
- Private certificates.
- Personal credentials.
- Production secrets.

Use `.env.local` for local development secrets when required.

---

<a id="project-status"></a>
## Project Status
### Current Capabilities

-  React/Vite web dashboard.
-  Local Electron desktop agent.
-  Local WebSocket communication.
-  Windows application detection.
-  Protected application handling.
-  Window minimization.
-  Window restoration.
-  Dedicated Codeforces Electron workspace.
-  Fullscreen/kiosk behavior.
-  System tray controls.
-  Emergency Exit Focus.
-  Focus-session recovery state.
-  Windows installer packaging.
-  Portable Windows build.
-  GitHub-based contributor workflow.

### Release Artifacts

The Windows release produces:

```text
Focuser-Setup-1.0.0.exe
Focuser-Portable-1.0.0.exe
```

---

## Release Checklist

Before publishing a Windows release, verify:

```text
[ ] Website starts
[ ] Electron agent starts
[ ] WebSocket connects
[ ] Agent pairing works
[ ] Focus session starts
[ ] Windows are detected
[ ] Protected windows remain protected
[ ] Distracting windows are minimized
[ ] Codeforces opens in the dedicated Electron window
[ ] Fullscreen/kiosk behavior works
[ ] Normal applications remain minimized
[ ] Exit Focus works
[ ] Previously visible windows are restored
[ ] Agent remains operational after Exit Focus
[ ] Windows installer builds successfully
[ ] Installed application launches successfully
```

---

## Production Architecture

```text
                         GitHub
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        Web Deployment           Windows Release
              │                         │
              ▼                         ▼
       Focuser Website          Focuser-Setup.exe
              │                         │
              │                         │
              └────────────┬────────────┘
                           │
                     Local WebSocket
                           │
                           ▼
                    Focuser Agent
                           │
                           ▼
                       Windows OS
```

The web dashboard and desktop agent can be distributed independently.

The website communicates with the locally installed agent through:

```text
ws://127.0.0.1:4545
```

---

## Repository

[GitHub Repository](https://github.com/LakshaGoyal/focuser)

---

<a id="license"></a>
## License
See the repository license file for the applicable license and usage terms.

```
```
