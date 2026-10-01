param(
    [string]$action = "enumerate",
    [string]$handles = ""
)
$ProgressPreference = 'SilentlyContinue'

$code = @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;

public class Win32WindowHelper {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder strText, int maxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left; public int Top; public int Right; public int Bottom;
    }
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X; public int Y;
    }
    [StructLayout(LayoutKind.Sequential)]
    public struct WINDOWPLACEMENT {
        public int length;
        public int flags;
        public int showCmd;
        public POINT ptMinPosition;
        public POINT ptMaxPosition;
        public RECT rcNormalPosition;
    }
    [DllImport("user32.dll")]
    public static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT lpwndpl);

    public class WindowItem {
        public string Handle { get; set; }
        public string Title { get; set; }
        public uint ProcessId { get; set; }
        public string ProcessName { get; set; }
        public bool IsMinimized { get; set; }
        public int ShowCmd { get; set; }
    }

    public static List<WindowItem> GetWindows() {
        List<WindowItem> list = new List<WindowItem>();
        EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
            if (IsWindowVisible(hWnd)) {
                StringBuilder sb = new StringBuilder(512);
                int len = GetWindowTextW(hWnd, sb, 512);
                if (len > 0) {
                    string title = sb.ToString().Trim();
                    if (!string.IsNullOrEmpty(title) && title != "Program Manager") {
                        uint pid = 0;
                        GetWindowThreadProcessId(hWnd, out pid);
                        string pName = "";
                        try {
                            if (pid > 0) {
                                pName = Process.GetProcessById((int)pid).ProcessName;
                            }
                        } catch {}

                        WINDOWPLACEMENT wp = new WINDOWPLACEMENT();
                        wp.length = Marshal.SizeOf(wp);
                        GetWindowPlacement(hWnd, ref wp);

                        list.Add(new WindowItem {
                            Handle = hWnd.ToInt64().ToString(),
                            Title = title,
                            ProcessId = pid,
                            ProcessName = pName,
                            IsMinimized = IsIconic(hWnd),
                            ShowCmd = wp.showCmd
                        });
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return list;
    }

    public static WindowItem GetForeground() {
        IntPtr hWnd = GetForegroundWindow();
        if (hWnd != IntPtr.Zero && IsWindowVisible(hWnd)) {
            StringBuilder sb = new StringBuilder(512);
            GetWindowTextW(hWnd, sb, 512);
            uint pid = 0;
            GetWindowThreadProcessId(hWnd, out pid);
            string pName = "";
            try {
                if (pid > 0) pName = Process.GetProcessById((int)pid).ProcessName;
            } catch {}

            WINDOWPLACEMENT wp = new WINDOWPLACEMENT();
            wp.length = Marshal.SizeOf(wp);
            GetWindowPlacement(hWnd, ref wp);

            return new WindowItem {
                Handle = hWnd.ToInt64().ToString(),
                Title = sb.ToString().Trim(),
                ProcessId = pid,
                ProcessName = pName,
                IsMinimized = IsIconic(hWnd),
                ShowCmd = wp.showCmd
            };
        }
        return null;
    }

    public static bool Minimize(string hStr) {
        try {
            IntPtr hWnd = new IntPtr(long.Parse(hStr));
            return ShowWindowAsync(hWnd, 6); // SW_MINIMIZE = 6
        } catch { return false; }
    }

    public static bool Restore(string hStr) {
        try {
            IntPtr hWnd = new IntPtr(long.Parse(hStr));
            return ShowWindowAsync(hWnd, 9); // SW_RESTORE = 9
        } catch { return false; }
    }

    public static bool IsValidWindow(string hStr) {
        try {
            IntPtr hWnd = new IntPtr(long.Parse(hStr));
            return IsWindow(hWnd);
        } catch { return false; }
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'Win32WindowHelper').Type) {
    try {
        Add-Type -TypeDefinition $code -Language CSharp -ErrorAction Stop
    } catch {}
}

if ($action -eq 'enumerate') {
    $list = @()
    if (([System.Management.Automation.PSTypeName]'Win32WindowHelper').Type) {
        $list = [Win32WindowHelper]::GetWindows()
    }

    # Fallback to Get-Process if EnumWindows returned empty in non-interactive environment
    if (-not $list -or $list.Count -eq 0) {
        $list = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle } | ForEach-Object {
            [PSCustomObject]@{
                Handle = $_.MainWindowHandle.ToString()
                Title = $_.MainWindowTitle
                ProcessId = $_.Id
                ProcessName = $_.ProcessName
                IsMinimized = $false
                ShowCmd = 1
            }
        }
    }

    if ($list) {
        $list | ConvertTo-Json -Compress
    } else {
        "[]"
    }
} elseif ($action -eq 'foreground') {
    if (([System.Management.Automation.PSTypeName]'Win32WindowHelper').Type) {
        $fg = [Win32WindowHelper]::GetForeground()
        if ($fg) { $fg | ConvertTo-Json -Compress } else { "{}" }
    } else {
        "{}"
    }
} elseif ($action -eq 'minimize') {
    $hList = $handles -split ','
    foreach ($h in $hList) {
        $cleanH = $h.Trim()
        if ($cleanH) {
            if (([System.Management.Automation.PSTypeName]'Win32WindowHelper').Type) {
                [Win32WindowHelper]::Minimize($cleanH)
            }
        }
    }
    "OK"
} elseif ($action -eq 'restore') {
    $hList = $handles -split ','
    foreach ($h in $hList) {
        $cleanH = $h.Trim()
        if ($cleanH) {
            if (([System.Management.Automation.PSTypeName]'Win32WindowHelper').Type) {
                [Win32WindowHelper]::Restore($cleanH)
            }
        }
    }
    "OK"
}
