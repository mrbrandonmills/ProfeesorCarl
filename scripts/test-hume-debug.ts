import * as dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.HUME_API_KEY;
const configId = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('Testing Hume EVI connection...');
console.log('API Key:', apiKey?.substring(0, 15) + '...');
console.log('Config ID:', configId);

const url = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}&config_id=${configId}`;

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('\n✓ CONNECTED');
});

ws.on('message', (data: Buffer) => {
  const msg = JSON.parse(data.toString());
  console.log('\n[MESSAGE]', msg.type);
  if (msg.type === 'error') {
    console.log('ERROR CODE:', msg.code);
    console.log('ERROR MESSAGE:', msg.message);
    console.log('FULL ERROR:', JSON.stringify(msg, null, 2));
  } else {
    console.log(JSON.stringify(msg, null, 2).substring(0, 500));
  }
});

ws.on('error', (err: Error) => {
  console.log('\n✗ ERROR:', err.message);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log('\n[CLOSED]');
  console.log('Code:', code);
  console.log('Reason:', reason.toString());
  process.exit(0);
});

setTimeout(() => {
  console.log('\n[Timeout - closing]');
  ws.close();
}, 15000);
