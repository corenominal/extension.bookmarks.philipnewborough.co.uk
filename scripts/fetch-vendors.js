#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const vendors = [
  {
    url: 'https://assets.philipnewborough.co.uk/assets/css/vendor/bootstrap.css',
    dest: 'assets/css/vendor/bootstrap.css',
  },
  {
    url: 'https://assets.philipnewborough.co.uk/assets/css/vendor/bootstrap-icons.css',
    dest: 'assets/css/vendor/bootstrap-icons.css',
  },
  {
    url: 'https://assets.philipnewborough.co.uk/assets/js/vendor/bootstrap.bundle.min.js',
    dest: 'assets/js/vendor/bootstrap.bundle.min.js',
  },
  {
    url: 'https://assets.philipnewborough.co.uk/assets/css/vendor/fonts/bootstrap-icons.woff2',
    dest: 'assets/css/vendor/fonts/bootstrap-icons.woff2',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  for (const { url, dest } of vendors) {
    await download(url, dest);
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
