const { execSync } = require('child_process');
const path = require('path');

function runStep(name, cmd, cwd) {
  console.log(`[DEPLOY] ${name}...`);
  try {
    execSync(cmd, { cwd: cwd || path.join(__dirname, '..'), stdio: 'inherit' });
  } catch (err) {
    console.error(`[FAILURE] ${name} failed:`, err.message);
    process.exit(1);
  }
}

function main() {
  const rootDir = path.join(__dirname, '..');
  const androidDir = path.join(rootDir, 'android');

  console.log('====================================================');
  console.log('[Dev Deploy] One-Click Build & Deploy Pipeline');
  console.log('====================================================');

  // 1. Build www/index.html from micro-modules
  runStep('1. Building www/index.html', 'node scripts/build.js', rootDir);

  // 2. Package www.zip for OTA updates
  runStep('2. Packaging dist/www.zip', 'node scripts/zip_www.js', rootDir);

  // 3. Capacitor Sync Android
  runStep('3. Syncing Android Web Assets', 'npx cap sync android', rootDir);

  // 4. Quiet Android APK Build
  process.env.JAVA_HOME = 'D:\\Android\\Android Studio\\jbr';
  runStep('4. Compiling Android Debug APK (-q)', 'cmd /c gradlew.bat assembleDebug -q', androidDir);

  console.log('====================================================');
  console.log('✅ [SUCCESS] Deployment Pipeline Complete!');
  console.log('====================================================');
}

if (require.main === module) {
  main();
}
