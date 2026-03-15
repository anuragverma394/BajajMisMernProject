const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'services');
const services = fs.readdirSync(servicesDir).filter((f) =>
  fs.statSync(path.join(servicesDir, f)).isDirectory()
);

let removed = 0;

for (const service of services) {
  const nodeModules = path.join(servicesDir, service, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
    removed += 1;
    console.log(`[${service}] Removed node_modules`);
  } else {
    console.log(`[${service}] node_modules not found`);
  }
}

console.log(`Done. Removed node_modules from ${removed} services.`);
