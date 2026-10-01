$ProgressPreference = 'SilentlyContinue'

$code = @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class FocuserWindowEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hWnd);
    [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
    [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int GetClassName(IntPtr hWnd, StringBuilder className, int maxCount);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    public class Item {
        public string Handle;
        public string Title;
        public string ProcessName;
        public string PreviousState;
    }

    public static List<Item> GetWindows() {
        var windows = new List<Item>();
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd) || IsIconic(hWnd)) return true;
            var titleBuffer = new StringBuilder(512);
            var classBuffer = new StringBuilder(256);
            GetWindowText(hWnd, titleBuffer, titleBuffer.Capacity);
            GetClassName(hWnd, classBuffer, classBuffer.Capacity);
            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);
            string processName = "";
            try { processName = System.Diagnostics.Process.GetProcessById((int)processId).ProcessName; } catch {}
            string title = titleBuffer.ToString().Trim();
            string className = classBuffer.ToString();
            if (!String.IsNullOrEmpty(title) || className == "CabinetWClass" || className == "ExploreWClass") {
                windows.Add(new Item {
                    Handle = hWnd.ToString(),
                    Title = title,
                    ProcessName = processName,
                    PreviousState = IsZoomed(hWnd) ? "maximized" : "normal"
                });
            }
            return true;
        }, IntPtr.Zero);
        return windows;
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp
[FocuserWindowEnum]::GetWindows() | ConvertTo-Json -Compress
