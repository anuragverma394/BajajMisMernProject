const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const servicesDir = path.join(__dirname, '..', 'services');
const services = fs.readdirSync(servicesDir).filter((f) =>
  fs.statSync(path.join(servicesDir, f)).isDirectory()
);

async function rebuildService(service) {
  const dir = path.join(servicesDir, service);
  const nodeModules = path.join(dir, 'node_modules');
  const packageLock = path.join(dir, 'package-lock.json');

  if (fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
  }
  if (fs.existsSync(packageLock)) {
    fs.rmSync(packageLock, { force: true });
  }

  console.log(`[${service}] Removed node_modules and package-lock.json`);

  return new Promise((resolve, reject) => {
    // 1. Install express and common dependencies
    const expressInstall = spawn(
      'npm',
      ['install', 'express@^4.21.2', 'cors', 'dotenv', 'mssql', 'multer', '--save'],
      {
        cwd: dir,
        shell: true
      }
    );

    expressInstall.on('close', (code) => {
      if (code !== 0) {
        console.error(`[${service}] Failed to install dependencies (code ${code})`);
        return reject(new Error(`Failed install for ${service}`));
      }

      // 2. Install rest from package.json
      const npmInstall = spawn('npm', ['install'], {
        cwd: dir,
        shell: true
      });

      npmInstall.on('close', (code2) => {
        if (code2 !== 0) {
          console.error(`[${service}] Failed to run npm install (code ${code2})`);
          return reject(new Error(`Failed npm install for ${service}`));
        }
        console.log(`[${service}] Rebuilt successfully.`);
        resolve();
      });
    });
  });
}

async function rebuildAll() {
  console.log(`Starting parallel rebuild for ${services.length} services...`);
  await Promise.allSettled(services.map(rebuildService));
  console.log('All services rebuilt.');
}

rebuildAll();
