import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const writeLine = (message) => {
  process.stdout.write(`${message}\n`);
};

const dir = path.join(process.cwd(), 'tar');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  writeLine('Created tar folder');
} else {
  writeLine('tar folder already exists');
}
