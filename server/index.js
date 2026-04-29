// Bootstrap: load .env FIRST, then import the actual server
// This is necessary because ES module imports are hoisted,
// meaning dotenv.config() inside server.js runs AFTER all imports.
import dotenv from 'dotenv';
dotenv.config();

await import('./server.js');
