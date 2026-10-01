// /**
//  * Rules and matchers for protected applications and system windows.
//  * Protected windows are NEVER minimized or hidden during focus mode.
//  */
// export class ProtectedAppsManager {
//   public static protectedApplications: string[] = [
//     'focuser',
//     'electron',
//     'program manager',
//     'start',
//     'taskbar',
//     'windows input experience',
//     'system settings',
//     'task manager',
//     'windows shell experience host',
//     'action center',
//     'notification center',
//   ];

//   private static dynamicProtectedHwnds: Set<string> = new Set();
//   private static dynamicProtectedTitles: Set<string> = new Set();

//   /**
//    * Dynamically protects a specific window handle (e.g. Codeforces browser window).
//    */
//   public static addDynamicProtectedHwnd(hwnd: string): void {
//     if (hwnd) {
//       this.dynamicProtectedHwnds.add(hwnd.trim());
//     }
//   }

//   /**
//    * Dynamically protects a title pattern (e.g. "codeforces").
//    */
//   public static addDynamicProtectedTitle(pattern: string): void {
//     if (pattern) {
//       this.dynamicProtectedTitles.add(pattern.toLowerCase().trim());
//     }
//   }

//   /**
//    * Clears dynamic protections upon exiting focus mode.
//    */
//   public static clearDynamicProtections(): void {
//     this.dynamicProtectedHwnds.clear();
//     this.dynamicProtectedTitles.clear();
//   }

//   /**
//    * Returns true if the window handle, title, or process name matches a protected application.
//    */
//   public static isProtectedWindow(handle: string, title: string, processName?: string): boolean {
//     if (handle && this.dynamicProtectedHwnds.has(handle.trim())) {
//       return true;
//     }

//     const lowerTitle = title ? title.toLowerCase().trim() : '';
//     const lowerProc = processName ? processName.toLowerCase().trim() : '';

//     // Check dynamic titles (e.g. codeforces)
//     for (const pattern of this.dynamicProtectedTitles) {
//       if (lowerTitle.includes(pattern)) {
//         return true;
//       }
//     }

//     if (!lowerTitle) {
//       // Untitled non-explorer handles are background OS surfaces
//       return lowerProc !== 'explorer';
//     }

//     // Check static protected application patterns
//     for (const pattern of this.protectedApplications) {
//       if (lowerTitle.includes(pattern) || (lowerProc && lowerProc.includes(pattern))) {
//         return true;
//       }
//     }

//     return false;
//   }
// }
/**
 * Rules and matchers for applications and system windows that must remain
 * accessible during Focus Mode.
 *
 * Protected windows are never minimized or hidden by the Windows focus
 * controller. Static protections cover known Focuser/system windows, while
 * dynamic protections allow a specific window handle or title pattern to be
 * protected for the duration of a focus session.
 */
export class ProtectedAppsManager {
  public static protectedApplications: string[] = [
    'focuser',
    'electron',
    'program manager',
    'start',
    'taskbar',
    'windows input experience',
    'system settings',
    'task manager',
    'windows shell experience host',
    'action center',
    'notification center',
  ];

  private static dynamicProtectedHwnds: Set<string> = new Set();
  private static dynamicProtectedTitles: Set<string> = new Set();

  /**
   * Dynamically protects a specific window handle, such as the
   * Codeforces focus window.
   */
  public static addDynamicProtectedHwnd(hwnd: string): void {
    if (hwnd) {
      this.dynamicProtectedHwnds.add(hwnd.trim());
    }
  }

  /**
   * Dynamically protects windows whose title contains the supplied pattern.
   */
  public static addDynamicProtectedTitle(pattern: string): void {
    if (pattern) {
      this.dynamicProtectedTitles.add(pattern.toLowerCase().trim());
    }
  }

  /**
   * Removes all session-specific protections when Focus Mode ends.
   */
  public static clearDynamicProtections(): void {
    this.dynamicProtectedHwnds.clear();
    this.dynamicProtectedTitles.clear();
  }

  /**
   * Determines whether a window should remain protected.
   *
   * Matching is performed against:
   * 1. A dynamically protected window handle.
   * 2. A dynamically protected title pattern.
   * 3. Static application/system-window patterns.
   *
   * Untitled non-Explorer windows are also treated as protected OS surfaces.
   */
  public static isProtectedWindow(handle: string, title: string, processName?: string): boolean {
    if (handle && this.dynamicProtectedHwnds.has(handle.trim())) {
      return true;
    }

    const lowerTitle = title ? title.toLowerCase().trim() : '';
    const lowerProc = processName ? processName.toLowerCase().trim() : '';

    // Check dynamic titles (e.g. codeforces)
    for (const pattern of this.dynamicProtectedTitles) {
      if (lowerTitle.includes(pattern)) {
        return true;
      }
    }

    if (!lowerTitle) {
      // Untitled non-explorer handles are background OS surfaces
      return lowerProc !== 'explorer';
    }

    // Check static protected application patterns
    for (const pattern of this.protectedApplications) {
      if (lowerTitle.includes(pattern) || (lowerProc && lowerProc.includes(pattern))) {
        return true;
      }
    }

    return false;
  }
}
