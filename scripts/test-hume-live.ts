// Direct test of Hume EVI WebSocket connection
import * as dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.HUME_API_KEY;
const configId = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('='.repeat(60));
console.log('TESTING HUME EVI WEBSOCKET CONNECTION');
console.log('='.repeat(60));
console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
console.log('Config ID:', configId);
console.log('');

const url = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}&config_id=${configId}`;
console.log('Connecting to:', url.replace(apiKey!, 'API_KEY_HIDDEN'));

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('\n✓ WebSocket CONNECTED');
  console.log('Waiting for messages from Hume...');
});

ws.on('message', (data: Buffer) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('\n[MESSAGE TYPE]:', msg.type);
    if (msg.type === 'error') {
      console.log('ERROR:', msg.message || msg.error || JSON.stringify(msg));
    } else if (msg.type === 'chat_metadata') {
      console.log('Chat ID:', msg.chat_id);
    } else if (msg.type === 'assistant_message') {
      console.log('Content:', msg.message?.content?.substring(0, 200));
    } else if (msg.type === 'audio_output') {
      console.log('Audio:', msg.data ? `${msg.data.length} chars base64` : 'none');
    } else {
      console.log('Data:', JSON.stringify(msg, null, 2).substring(0, 300));
    }
  } catch (e) {
    console.log('Raw:', data.toString().substring(0, 200));
  }
});

ws.on('error', (err: Error) => {
  console.log('\n✗ ERROR:', err.message);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log('\n[CLOSED] Code:', code, 'Reason:', reason.toString() || 'none');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n[10s timeout] Closing...');
  ws.close();
}, 10000);
