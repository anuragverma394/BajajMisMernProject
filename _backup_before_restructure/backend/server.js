const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const services = [
  { name: 'auth-service', port: 5001 },
  { name: 'user-service', port: 5002 },
  { name: 'dashboard-service', port: 5003 },
  { name: 'report-service', port: 5004 },
  { name: 'lab-service', port: 5005 },
  { name: 'survey-service', port: 5006 },
  { name: 'tracking-service', port: 5007 },
  { name: 'distillery-service', port: 5008 },
  { name: 'whatsapp-service', port: 5009 },
  { name: 'api-gateway', port: 5000 }
];

const children = [];
const serviceRoot = path.join(__dirname, 'services');

function isPortInUseOnHost(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));

    socket.connect(port, host);
  });
}

async function isPortInUse(port) {
  const hosts = ['127.0.0.1', '::1'];
  for (const host of hosts) {
    if (await isPortInUseOnHost(port, host)) {
      return true;
    }
  }
  return false;
}

async function startService(service) {
  const { name, port } = service;
  const alreadyRunning = await isPortInUse(port);
  if (alreadyRunning) {
    console.log(`[backend] ${name} skipped (port ${port} already in use)`);
    return;
  }

  const cwd = path.join(serviceRoot, name);
  const child = spawn(process.execPath, ['server.js'], {
    cwd,
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[backend] ${name} exited with ${reason}`);
  });

  child.on('error', (error) => {
    console.error(`[backend] failed to start ${name}: ${error.message}`);
  });

  children.push({ name, child });
}

function shutdown(signal) {
  console.log(`[backend] received ${signal}, stopping services...`);
  for (const { child } of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

console.log('[backend] starting microservices...');
Promise.all(services.map(startService)).catch((error) => {
  console.error(`[backend] launcher error: ${error.message}`);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
