import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const writeStdout = (message) => {
  process.stdout.write(`${message}\n`);
};

const writeStderr = (message) => {
  process.stderr.write(`${message}\n`);
};

const [platform, gradleTask] = process.argv.slice(2);

if (!platform || !gradleTask) {
  writeStderr('Usage: node gradleBuild.mjs <platform> <gradleTask>');
  process.exit(1);
}

const BRAND = process.env.BRAND || 'abhiyan';
const APP_ENV = process.env.APP_ENV || 'development';
const VERSION = process.env.APP_VERSION || '1.0';
const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

const formatBrandName = (str) => {
  return str
    .split(/[_\s-]+/)
    .map((segment) =>
      segment.length <= 2
        ? segment.toUpperCase()
        : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join('');
};

const BrandFormatted = formatBrandName(BRAND);

try {
  writeStdout(`\n🚀 Starting ${BrandFormatted} (${APP_ENV}) build...`);

  writeStdout('\n🧩 Running Expo prebuild (dynamic config)...');
  execSync(`npx expo prebuild --platform ${platform} --no-install`, {
    stdio: 'inherit'
  });

  // RUN PREBUILD FIRST, THEN GENERATE ICONS
  const brandIcon = `./assets/${BRAND}/icon.png`;
  if (fs.existsSync(brandIcon)) {
    writeStdout(`\n🎨 Generating launcher icons for ${BrandFormatted}...`);
    try {
      execSync(`node generate-icons.mjs ${brandIcon}`, {
        stdio: 'inherit'
      });
    } catch {
      writeStderr('⚠️ Icon generation failed or skipped.');
    }
  }

  const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    if (manifestContent.includes('package=')) {
      manifestContent = manifestContent.replace(/\s*package="[^"]*"/, '');
      fs.writeFileSync(manifestPath, manifestContent, 'utf8');
      writeStdout("🧹 Removed deprecated 'package' attribute from AndroidManifest.xml");
    } else {
      writeStdout("✅ Manifest already clean (no 'package' attribute).");
    }
  }

  writeStdout(`\n🏗️ Running ${gradleCmd} ${gradleTask} ...`);
  execSync(`${gradleCmd} ${gradleTask}`, { cwd: 'android', stdio: 'inherit' });

  writeStdout('\n🔍 Searching for generated APK...');
  const apkBaseDir = path.join('android', 'app', 'build', 'outputs', 'apk');
  if (!fs.existsSync(apkBaseDir)) {
    writeStderr('❌ APK output directory not found!');
    process.exit(1);
  }

  const variantFolder =
    fs
      .readdirSync(apkBaseDir)
      .find((d) => d.toLowerCase().includes(APP_ENV.toLowerCase())) || 'release';

  const debugOrRelease = gradleTask.toLowerCase().includes('debug') ? 'debug' : 'release';
  const releaseDir = path.join(apkBaseDir, variantFolder, debugOrRelease);
  if (!fs.existsSync(releaseDir)) {
    writeStderr(`❌ No APK release folder found at ${releaseDir}`);
    process.exit(1);
  }

  const apkFiles = fs
    .readdirSync(releaseDir)
    .filter((f) => f.endsWith('.apk'))
    .map((f) => path.join(releaseDir, f));

  if (apkFiles.length === 0) {
    writeStderr('❌ No APK found in release folder!');
    process.exit(1);
  }

  const finalApk = apkFiles[0];
  const newFileName = `${BrandFormatted}AI_${APP_ENV.toUpperCase()}_${VERSION}.apk`;
  const newFilePath = path.join(releaseDir, newFileName);

  fs.renameSync(finalApk, newFilePath);

  writeStdout('\n✅ Build completed successfully!');
  writeStdout(`📁 Output: ${newFilePath}\n`);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  writeStderr(`\n❌ Build failed: ${errorMessage}`);
  process.exit(1);
}
