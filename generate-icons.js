import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error(
    "❌ Please provide a path to your PNG (e.g. node generate-icons.js ./assets/abhiyan/icon.png)"
  );
  process.exit(1);
}

const outputBase = path.resolve("android/app/src/main/res");

// Android launcher mipmap sizes (standard)
const sizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

(async () => {
  try {
    console.log(`\n🎨 Generating Android launcher icons from: ${inputPath}\n`);

    for (const [folder, size] of Object.entries(sizes)) {
      const dir = path.join(outputBase, folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // SQUARE ICON (fallback)
      const launcherPath = path.join(dir, "ic_launcher.webp");
      await sharp(inputPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 95 })
        .toFile(launcherPath);

      // ROUND ICON (fallback)
      const roundPath = path.join(dir, "ic_launcher_round.webp");
      const circleMask = Buffer.from(
        `<svg width="${size}" height="${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${
          size / 2
        }" fill="white"/>
        </svg>`
      );

      await sharp(inputPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .composite([{ input: circleMask, blend: "dest-in" }])
        .webp({ quality: 95 })
        .toFile(roundPath);

      // FOREGROUND ICON (used by Adaptive Icons)
      const foregroundPath = path.join(dir, "ic_launcher_foreground.webp");

      const SAFE_SCALE = 0.80;

      const paddedSize = Math.round(size * SAFE_SCALE);
      const padding = Math.round((size - paddedSize) / 2);

      await sharp(inputPath)
        .resize(paddedSize, paddedSize, { fit: "contain" })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 95 })
        .toFile(foregroundPath);

      console.log(
        `✅ ${folder}: launcher, round, foreground (${size}x${size})`
      );
    }

    console.log("\n🎉 All launcher icons generated successfully!\n");
  } catch (err) {
    console.error("❌ Icon generation error:", err);
    process.exit(1);
  }
})();