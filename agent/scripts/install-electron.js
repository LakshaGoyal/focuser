const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

async function installElectron() {
  const electronDir = path.resolve(__dirname, '../node_modules/electron');
  const distDir = path.join(electronDir, 'dist');
  const platform = process.platform;
  const platformPath = platform === 'win32' ? 'electron.exe' : platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : 'electron';
  const exePath = path.join(distDir, platformPath);
  const version = require(path.join(electronDir, 'package.json')).version;

  if (fs.existsSync(exePath) && fs.existsSync(path.join(electronDir, 'path.txt'))) {
    console.log('[install-electron] Electron binary already present at:', exePath);
    return;
  }

  console.log('[install-electron] Locating/downloading Electron v' + version + ' binary...');
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    platform: process.env.npm_config_platform || os.platform(),
    arch: process.env.npm_config_arch || os.arch(),
  });

  console.log('[install-electron] Cached zip path:', zipPath);
  console.log('[install-electron] Extracting to:', distDir);

  await fs.promises.mkdir(distDir, { recursive: true });

  if (platform === 'win32') {
    console.log('[install-electron] Using PowerShell Expand-Archive for Windows zip extraction...');
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${distDir.replace(/'/g, "''")}' -Force"`);
  } else {
    await extract(zipPath, { dir: distDir });
  }

  const srcTypeDefPath = path.join(distDir, 'electron.d.ts');
  const targetTypeDefPath = path.join(electronDir, 'electron.d.ts');
  if (fs.existsSync(srcTypeDefPath)) {
    try {
      fs.renameSync(srcTypeDefPath, targetTypeDefPath);
    } catch {
      // Ignore if rename fails
    }
  }

  fs.writeFileSync(path.join(electronDir, 'path.txt'), platformPath);
  console.log('[install-electron] Electron binary installed successfully at:', exePath);
}

installElectron().catch((err) => {
  console.error('[install-electron] Error installing Electron binary:', err);
  process.exit(1);
});
