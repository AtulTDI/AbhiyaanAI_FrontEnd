const { spawn } = require("child_process");
const [platform, task] = process.argv.slice(2);

const gradleCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const child = spawn(gradleCmd, [task], {
  cwd: platform,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code));
