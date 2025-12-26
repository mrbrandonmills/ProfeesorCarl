import * as dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.HUME_API_KEY;
const configId = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('Testing Hume with audio...\n');

const url = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}&config_id=${configId}`;
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('✓ Connected\n');
  
  // Send empty audio to trigger a response
  // Hume should respond after silence
  setTimeout(() => {
    console.log('Sending empty audio chunk...');
    const silentPCM = Buffer.alloc(3200, 0); // 100ms of silence at 16kHz 16-bit mono
    ws.send(JSON.stringify({
      type: 'audio_input',
      data: silentPCM.toString('base64'),
    }));
  }, 500);
});

ws.on('message', (data: Buffer) => {
  const msg = JSON.parse(data.toString());
  console.log('[MSG]', msg.type);
  
  if (msg.type === 'error') {
    console.log('ERROR CODE:', msg.code);
    console.log('ERROR MESSAGE:', msg.message);
    console.log('FULL:', JSON.stringify(msg, null, 2));
  } else if (msg.type === 'assistant_message') {
    console.log('CARL SAYS:', msg.message?.content);
  } else if (msg.type === 'audio_output') {
    console.log('AUDIO:', msg.data?.length, 'chars');
  } else if (msg.type === 'tool_call') {
    console.log('TOOL CALL:', msg.name);
    console.log('Params:', msg.parameters);
    // Send tool response
    ws.send(JSON.stringify({
      type: 'tool_response',
      tool_call_id: msg.tool_call_id,
      content: 'No relevant memories found yet.',
    }));
  }
});

ws.on('error', (err: Error) => {
  console.log('ERROR:', err.message);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log('\nClosed:', code, reason.toString());
  process.exit(0);
});

setTimeout(() => {
  console.log('\n[Timeout]');
  ws.close();
}, 30000);
