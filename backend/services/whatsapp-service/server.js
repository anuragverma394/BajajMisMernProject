require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT || 5009);
let server;

async function bootstrap() {
  try {
    if (String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() !== 'true') {
      await connectDatabase();
    }

    server = app.listen(port, () => {
      console.log(`whatsapp-service listening on port ${port}`);
    });
  } catch (error) {
    console.error('whatsapp-service failed to start', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  if (server) {
    server.close(() => {
      console.log('whatsapp-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  if (server) {
    server.close(() => {
      console.log('whatsapp-service shut down');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

bootstrap();
