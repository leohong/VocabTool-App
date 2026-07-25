const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('====================================================');
  console.log('[Zip Tool] Generating www.zip for OTA Release...');
  console.log('====================================================');

  const rootDir = path.join(__dirname, '..');
  const wwwDir = path.join(rootDir, 'www');
  const distDir = path.join(rootDir, 'dist');

  // 1. Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
    console.log('Created dist/ directory.');
  }

  // 2. Clear old zip if exists
  const zipPath = path.join(distDir, 'www.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log('Removed old www.zip.');
  }

  // 3. Compress using PowerShell Compress-Archive
  try {
    // -Path www\* packages files directly inside the zip root (no nested www/ folder)
    const cmd = `powershell -Command "Compress-Archive -Path '${wwwDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    console.log('Running PowerShell Compress-Archive...');
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[SUCCESS] Generated OTA package: ${zipPath}`);
  } catch (err) {
    console.error('[FAILURE] Failed to compress folder:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
