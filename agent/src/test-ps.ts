import { execSync } from 'child_process';

function runPowerShellScript(script: string): string {
  const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + script;
  const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
  return execSync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, {
    encoding: 'utf-8',
  });
}

const enumScript = `
$code = @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WindowManager {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder strText, int maxCount);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    public class WindowInfo {
        public string Handle;
        public string Title;
        public uint ProcessId;
    }

    public static List<WindowInfo> GetVisibleWindows() {
        List<WindowInfo> windows = new List<WindowInfo>();
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                StringBuilder sb = new StringBuilder(512);
                int len = GetWindowText(hWnd, sb, 512);
                if (len > 0) {
                    string title = sb.ToString();
                    if (!string.IsNullOrWhiteSpace(title)) {
                        uint pid;
                        GetWindowThreadProcessId(hWnd, out pid);
                        windows.Add(new WindowInfo {
                            Handle = hWnd.ToString(),
                            Title = title,
                            ProcessId = pid
                        });
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
        return windows;
    }
}
'@
Add-Type -TypeDefinition $code -Language CSharp
$res = [WindowManager]::GetVisibleWindows()
if ($res.Count -eq 0) {
  Write-Output "[]"
} else {
  $res | ConvertTo-Json -Compress
}
`;

try {
  const rawOutput = runPowerShellScript(enumScript);
  console.log('Raw output:', rawOutput.substring(0, 300));
  const parsed = JSON.parse(rawOutput.trim());
  const list = Array.isArray(parsed) ? parsed : [parsed];
  console.log('Enumerated visible windows count:', list.length);
  console.log('Sample windows:', list.slice(0, 10));
} catch (err) {
  console.error('Failed to run PS script:', err);
}
