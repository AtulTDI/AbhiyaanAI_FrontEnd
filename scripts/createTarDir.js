const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'tar');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log('Created tar folder');
} else {
  console.log('tar folder already exists');
}
