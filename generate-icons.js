/**
 * generate-icons.js
 * Automatically generate Android mipmap WebP icons (square + round + foreground)
 * Foreground icons are scaled to 66% and padded to avoid cropping in adaptive icons.
 * Usage: node generate-icons.js ./assets/logo.png
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("❌ Please provide a path to your base PNG (e.g. node generate-icons.js ./assets/logo.png)");
  process.exit(1);
}

const outputBase = path.resolve("android/app/src/main/res");

// Standard Android mipmap icon sizes
const sizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

(async () => {
  try {
    console.log(`🎨 Generating Android WebP icons from: ${inputPath}\n`);

    for (const [folder, size] of Object.entries(sizes)) {
      const dir = path.join(outputBase, folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // --- Square launcher icon ---
      const launcherPath = path.join(dir, "ic_launcher.webp");
      await sharp(inputPath)
        .resize(size, size)
        .webp({ quality: 95 })
        .toFile(launcherPath);

      // --- Round launcher icon ---
      const roundPath = path.join(dir, "ic_launcher_round.webp");
      const circleSvg = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
      );
      await sharp(inputPath)
        .resize(size, size)
        .composite([{ input: circleSvg, blend: "dest-in" }])
        .webp({ quality: 95 })
        .toFile(roundPath);

      // --- Foreground icon (adaptive) ---
      const foregroundPath = path.join(dir, "ic_launcher_foreground.webp");

      // Scale to 90% and add transparent padding
      const scaledSize = Math.round(size * 0.8);
      const padding = Math.round((size - scaledSize) / 2);

      await sharp(inputPath)
        .resize(scaledSize, scaledSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent padding
        })
        .webp({ quality: 95 })
        .toFile(foregroundPath);

      console.log(`✅ ${folder}/ic_launcher.webp, ic_launcher_round.webp & ic_launcher_foreground.webp (${size}x${size})`);
    }

    console.log("\n🎉 All WebP launcher icons generated successfully!");
  } catch (err) {
    console.error("❌ Error generating icons:", err);
    process.exit(1);
  }
})();