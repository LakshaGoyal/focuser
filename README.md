````markdown
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

# Overview

Focuser pairs two major components:

1. **Web Dashboard**
   - Provides the user interface.
   - Allows the user to start and end focus sessions.
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

# Key Features

## Focus Session Control

Users can start and stop a Focus Session from the web dashboard.

The dashboard communicates with the local Focuser agent through:

```text
ws://127.0.0.1:4545
````

---

## Windows Application Management

During Focus Mode, Focuser can:

* Detect visible Windows application windows.
* Preserve protected applications and system windows.
* Minimize distracting application windows.
* Preserve the state of windows before Focus Mode starts.
* Restore previously visible windows after Focus Mode ends.

Applications are minimized rather than terminated.

---

## Dedicated Codeforces Focus Workspace

For Codeforces sessions, Focuser creates a dedicated Electron `BrowserWindow`.

The Codeforces page is loaded directly inside the Focuser desktop application rather than being opened in the user's normal Chrome/Edge browser.

This allows the focus workspace to use:

* Fullscreen behavior
* Kiosk behavior
* Hidden menu bars
* Always-on-top behavior
* Dedicated application-level window management

The user's normal browser windows remain separate from the dedicated focus workspace.

---

## Local Desktop Agent

The Electron agent runs locally on Windows and exposes a localhost-only WebSocket server:

```text
127.0.0.1:4545
```

The local agent is responsible for operations that cannot safely be performed directly by a normal browser.

---

## System Tray Support

Focuser provides a desktop tray interface that allows the user to access agent controls, including an emergency **Exit Focus** action.

The emergency exit is designed to allow the user to recover the desktop state if the web dashboard is unavailable.

---

## Desktop State Restoration

Before entering Focus Mode, Focuser records the relevant desktop window state.

When Focus Mode ends:

```text
Focus Window
     ↓
Close
     ↓
Restore previously visible applications
     ↓
Clear Focus State
     ↓
Normal Desktop
```

---

# Architecture

The high-level architecture is:

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

---

# Core Architecture Principle

The website **does not directly control Windows**.

Instead:

```text
Website
   │
   │ Focus command
   ▼
Local WebSocket
   │
   ▼
Electron Agent
   │
   │ OS-level operations
   ▼
Windows
```

This separation keeps browser functionality and desktop functionality independent.

---

# System Workflow

## 1. User opens the website

The user opens the Focuser web dashboard.

```text
Browser
   ↓
Focuser Website
```

---

## 2. Website connects to the local agent

The website connects to:

```text
ws://127.0.0.1:4545
```

The local agent accepts the WebSocket connection.

---

## 3. User starts a Focus Session

The user selects the desired focus destination and duration and starts the session.

The website sends a focus command to the local agent.

```text
Website
   ↓
WebSocket
   ↓
Focuser Agent
```

---

## 4. Agent enters Focus Mode

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

---

## 5. User works inside the focus workspace

For a Codeforces session:

```text
Focuser Electron Window
        ↓
https://codeforces.com/
```

The Codeforces page is displayed inside the dedicated Focuser window.

Normal desktop applications remain minimized during the focus session.

---

## 6. User exits Focus Mode

When Focus Mode ends:

```text
Exit Focus
     ↓
Close dedicated focus window
     ↓
Clear dynamic protections
     ↓
Restore previous Windows state
     ↓
Clear active session state
     ↓
Normal desktop
```

---

# Focus Mode Workflow

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

# Protected Applications

Focuser maintains a list of applications and system windows that should remain protected during Focus Mode.

Examples include:

* Focuser
* Electron
* Program Manager
* Start
* Taskbar
* Windows Input Experience
* System Settings
* Task Manager
* Windows Shell Experience Host
* Action Center
* Notification Center

Focuser also supports **dynamic protections**.

For example, a specific Codeforces focus window can be protected dynamically using its window handle or title pattern.

This allows the focus controller to distinguish the active focus workspace from distracting windows.

---

# Technology Stack

## Frontend

* React
* Vite
* TypeScript
* WebSocket

## Desktop Agent

* Electron
* Node.js
* TypeScript

## Windows Integration

* Windows APIs
* PowerShell
* Windows window handles
* Application/window enumeration
* Window minimization and restoration

## Build and Packaging

* Electron Builder
* NSIS Windows installer
* Portable Windows executable

## Development Tools

* VS Code / Antigravity
* Git
* GitHub
* npm

---

# Project Structure

The project is organized into separate frontend and desktop-agent responsibilities.

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

> Directory names may evolve as the project develops. The important architectural separation is between the web client and the local Windows agent.

---

# Local Development

## Requirements

For development, install:

* Windows 10 or Windows 11
* Node.js 20 or later
* npm
* Git
* A modern web browser
* VS Code or another compatible editor

Windows is required for testing the desktop window-management functionality.

---

# Clone the Repository

```powershell
git clone https://github.com/LakshaGoyal/focuser.git
cd focuser
```

---

# Install Dependencies

```powershell
npm install
```

---

# Start Development Environment

Run:

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

---

# Run Only the Agent

To start only the Electron desktop agent:

```powershell
npm run dev:agent
```

The agent should report that it is ready on:

```text
ws://127.0.0.1:4545
```

---

# Environment Configuration

An example environment configuration is provided in:

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

The normal/default endpoint is:

```text
ws://127.0.0.1:4545
```

---

# Building the Windows Application

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

---

# Windows Installer

## `Focuser-Setup-1.0.0.exe`

The setup executable is the normal Windows installation package.

It installs the Focuser desktop application and its required runtime resources.

The installed application includes:

* Electron runtime
* Compiled Focuser agent
* Required dependencies
* Windows helper resources

After installation, users do not need:

* Node.js
* npm
* Git
* VS Code
* The Focuser source repository

to run the installed desktop agent.

---

# Portable Version

## `Focuser-Portable-1.0.0.exe`

The portable build can be used without a traditional installation process.

The installer version is intended to be the primary distribution format.

---

# User Installation

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

# Production Architecture

The intended production workflow is:

```text
                     GitHub
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
       Web Deployment        Windows Release
            │                     │
            ▼                     ▼
     Focuser Website       Focuser-Setup.exe
            │                     │
            │                     │
            └──────────┬──────────┘
                       │
                 Local WebSocket
                       │
                       ▼
                Focuser Agent
                       │
                       ▼
                  Windows OS
```

The website can be hosted independently from the desktop agent.

The desktop agent remains installed locally on the user's Windows machine.

---

# Local WebSocket Security

The Focuser agent binds specifically to:

```text
127.0.0.1:4545
```

rather than exposing the WebSocket service to the local network.

This means the desktop control interface is intended to remain local to the user's machine.

The website communicates with the local agent through localhost.

---

# Recovery and Fail-Safe Behavior

Focuser persists active focus-session state so that the application can recover from unexpected interruptions.

The recovery workflow is designed around:

```text
Focus Session
      │
      ▼
Session State Persisted
      │
      ▼
Windows State Captured
      │
      ▼
Focus Mode Active
      │
      ├── Normal Exit
      │
      └── Unexpected Interruption
              │
              ▼
        Recovery Handling
              │
              ▼
       Restore Desktop
```

The system should restore previously affected windows rather than terminating applications.

---

# Development Guidelines

When contributing to Focuser:

### Keep responsibilities separated

Frontend code should handle:

* UI
* Session controls
* User interaction
* WebSocket communication

Agent code should handle:

* Desktop integration
* Windows window management
* Focus workspace
* Tray controls
* Recovery

### Avoid unnecessary architectural changes

The local WebSocket boundary is an important part of the system:

```text
Website
   ↓
localhost WebSocket
   ↓
Electron Agent
```

Changes to this boundary should be reviewed carefully.

### Do not terminate user applications

Focus Mode should minimize and restore applications rather than terminating them.

### Test Windows behavior

Changes involving:

* `WindowsFocusController`
* window enumeration
* window handles
* minimization
* restoration
* kiosk mode
* fullscreen
* protected applications

should be tested on Windows before merging.

---

# Contributor Workflow

Focuser uses a branch-based contribution workflow.

Contributors should **not directly modify `main`**.

Recommended workflow:

```text
main
 │
 ├── feature/member-1
 ├── feature/member-2
 ├── feature/member-3
 └── feature/member-4
```

## 1. Clone the repository

```powershell
git clone https://github.com/LakshaGoyal/focuser.git
cd focuser
```

## 2. Create a branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/my-change
```

## 3. Make the change

Keep the change focused on the assigned task.

## 4. Commit

Use a clear commit message:

```powershell
git add .
git commit -m "docs: improve installation guide"
```

## 5. Push the branch

```powershell
git push -u origin feature/my-change
```

## 6. Open a Pull Request

Create a Pull Request from:

```text
feature/my-change
        ↓
      main
```

## 7. Review

Changes should be reviewed before being merged into `main`.

This keeps the stable branch protected while allowing contributors to work independently.

---

# Contributors

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

# Example Contribution Structure

A typical contribution should follow:

```text
Contributor
     │
     ▼
Create Branch
     │
     ▼
Implement Change
     │
     ▼
Test Change
     │
     ▼
Commit
     │
     ▼
Push Branch
     │
     ▼
Pull Request
     │
     ▼
Code Review
     │
     ▼
Merge
     │
     ▼
main
```

---

# Troubleshooting

## Agent does not start

Make sure another Focuser instance is not already running.

PowerShell:

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*Focuser*"}
```

If an old development instance is running, close it before starting another instance.

---

## Port 4545 is already in use

Check:

```powershell
Get-NetTCPConnection -LocalPort 4545 -ErrorAction SilentlyContinue
```

If another Focuser process is already using the port, close the existing agent before starting a new one.

---

## Website cannot connect to the agent

Verify that the agent reports:

```text
ws://127.0.0.1:4545
```

Also verify that the website's WebSocket configuration points to:

```text
ws://127.0.0.1:4545
```

---

## Codeforces opens in the wrong browser

The Focus Mode implementation is designed to open Codeforces in the dedicated Electron focus workspace.

If Codeforces opens in the normal browser instead, verify that the Electron agent is running the current packaged build and that the focus-window implementation is being used.

---

## Windows are not restored

Use the Focuser tray's **Exit Focus** option.

The focus agent maintains state required for restoration and recovery.

---

# Testing Checklist

Before releasing a Windows build, verify:

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
[ ] Normal applications remain inaccessible during Focus Mode
[ ] Exit Focus works
[ ] Previously visible windows are restored
[ ] Agent remains operational after Exit Focus
[ ] Windows installer builds successfully
[ ] Installed application launches successfully
```

---

# Packaging Notes

The desktop agent binds only to:

```text
127.0.0.1:4545
```

The Windows package includes the resources required by the desktop agent, including the Windows helper used for window-management operations.

GitHub Actions can be used to build Windows artifacts automatically, while local packaging remains available through:

```powershell
npm run dist
```

Generated release artifacts are placed in:

```text
agent/release/
```

---

# Project Goals

Focuser is built around the following goals:

* Provide a focused Windows workspace.
* Keep desktop control inside a local trusted agent.
* Keep the web dashboard separate from operating-system operations.
* Minimize distracting applications instead of terminating them.
* Preserve and restore the user's desktop state.
* Provide a dedicated focus workspace.
* Provide an emergency exit mechanism.
* Keep the architecture modular and maintainable.
* Make the project easy for contributors to understand and extend.

---

# Current Architecture Summary

```text
┌─────────────────────────────────────────────────────┐
│                    USER                             │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                FOCUSER WEBSITE                      │
│                 React / Vite                        │
│                                                     │
│  • Start Focus                                     │
│  • End Focus                                       │
│  • Session UI                                      │
│  • Agent connection                                │
└───────────────────────┬─────────────────────────────┘
                        │
                        │ WebSocket
                        │ 127.0.0.1:4545
                        ▼
┌─────────────────────────────────────────────────────┐
│              FOCUSER DESKTOP AGENT                  │
│                    Electron                         │
│                                                     │
│  • WebSocket Server                                │
│  • Focus Controller                                │
│  • Windows Focus Controller                        │
│  • Window State Manager                            │
│  • Recovery Manager                                │
│  • Tray Integration                                │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    WINDOWS                          │
│                                                     │
│  • Window enumeration                              │
│  • Window minimization                             │
│  • Window restoration                              │
│  • Protected system windows                        │
│  • Dedicated Electron focus window                 │
└─────────────────────────────────────────────────────┘
```

---

# Release

Windows releases should contain the installer:

```text
Focuser-Setup-1.0.0.exe
```

and optionally:

```text
Focuser-Portable-1.0.0.exe
```

The installer is the recommended distribution format for normal Windows users.

---

# Repository

GitHub:

**[https://github.com/LakshaGoyal/focuser](https://github.com/LakshaGoyal/focuser)**

---

# License

See the repository license file for the applicable license and usage terms.

```
```
