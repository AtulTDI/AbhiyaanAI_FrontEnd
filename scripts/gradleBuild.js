const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [platform, gradleTask] = process.argv.slice(2);

if (!platform || !gradleTask) {
  console.error("Usage: node gradleBuild.js <platform> <gradleTask>");
  process.exit(1);
}

const BRAND = process.env.BRAND || "abhiyan";
const APP_ENV = process.env.APP_ENV || "development";
const VERSION = process.env.APP_VERSION || "1.0";
const gradleCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const formatBrandName = (str) => {
  return str
    .split(/[_\s-]+/)
    .map((segment) =>
      segment.length <= 2
        ? segment.toUpperCase()
        : segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join("");
};

const BrandFormatted = formatBrandName(BRAND);

try {
  console.log(`\n🚀 Starting ${BrandFormatted} (${APP_ENV}) build...`);

  console.log("\n🧩 Running Expo prebuild (dynamic config)...");
  execSync(`npx expo prebuild --platform ${platform} --no-install`, {
    stdio: "inherit",
  });

  // RUN PREBUILD FIRST, THEN GENERATE ICONS
  const brandIcon = `./assets/${BRAND}/icon.png`;
  if (fs.existsSync(brandIcon)) {
    console.log(`\n🎨 Generating launcher icons for ${BrandFormatted}...`);
    try {
      execSync(`node generate-icons.js ${brandIcon}`, {
        stdio: "inherit",
      });
    } catch {
      console.warn("⚠️ Icon generation failed or skipped.");
    }
  }

  const manifestPath = path.join(
    "android",
    "app",
    "src",
    "main",
    "AndroidManifest.xml"
  );
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, "utf8");
    if (manifestContent.includes("package=")) {
      manifestContent = manifestContent.replace(/\s*package="[^"]*"/, "");
      fs.writeFileSync(manifestPath, manifestContent, "utf8");
      console.log(
        "🧹 Removed deprecated 'package' attribute from AndroidManifest.xml"
      );
    } else {
      console.log("✅ Manifest already clean (no 'package' attribute).");
    }
  }

  console.log(`\n🏗️ Running ${gradleCmd} ${gradleTask} ...`);
  execSync(`${gradleCmd} ${gradleTask}`, { cwd: "android", stdio: "inherit" });

  console.log("\n🔍 Searching for generated APK...");
  const apkBaseDir = path.join("android", "app", "build", "outputs", "apk");
  if (!fs.existsSync(apkBaseDir)) {
    console.error("❌ APK output directory not found!");
    process.exit(1);
  }

  const variantFolder =
    fs
      .readdirSync(apkBaseDir)
      .find((d) => d.toLowerCase().includes(APP_ENV.toLowerCase())) ||
    "release";

  const releaseDir = path.join(apkBaseDir, variantFolder, "release");
  if (!fs.existsSync(releaseDir)) {
    console.error(`❌ No APK release folder found at ${releaseDir}`);
    process.exit(1);
  }

  const apkFiles = fs
    .readdirSync(releaseDir)
    .filter((f) => f.endsWith(".apk"))
    .map((f) => path.join(releaseDir, f));

  if (apkFiles.length === 0) {
    console.error("❌ No APK found in release folder!");
    process.exit(1);
  }

  const finalApk = apkFiles[0];
  const newFileName = `${BrandFormatted}AI_${APP_ENV.toUpperCase()}_${VERSION}.apk`;
  const newFilePath = path.join(releaseDir, newFileName);

  fs.renameSync(finalApk, newFilePath);

  console.log(`\n✅ Build completed successfully!`);
  console.log(`📁 Output: ${newFilePath}\n`);
} catch (err) {
  console.error(`\n❌ Build failed: ${err.message}`);
  process.exit(1);
}
