import * as dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.HUME_API_KEY;
const configId = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('=== HUME TEXT INPUT TEST ===\n');

const url = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}&config_id=${configId}`;
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('✓ Connected\n');
  
  // Send text input instead of audio
  setTimeout(() => {
    console.log('Sending text message: "Hello Professor Carl"...\n');
    ws.send(JSON.stringify({
      type: 'user_input',
      text: 'Hello Professor Carl, how are you today?',
    }));
  }, 500);
});

ws.on('message', (data: Buffer) => {
  const msg = JSON.parse(data.toString());
  
  console.log('[MSG]', msg.type);
  
  if (msg.type === 'error') {
    console.log('ERROR CODE:', msg.code);
    console.log('ERROR MSG:', msg.message);
    console.log('FULL:', JSON.stringify(msg, null, 2));
  } else if (msg.type === 'tool_call') {
    console.log('TOOL:', msg.name);
    console.log('ID:', msg.tool_call_id);
    
    // Send response
    ws.send(JSON.stringify({
      type: 'tool_response', 
      tool_call_id: msg.tool_call_id,
      content: 'Brandon is building Professor Carl as an AI tutor. No other context yet.',
    }));
    console.log('Sent tool response\n');
  } else if (msg.type === 'assistant_message') {
    console.log('CARL:', msg.message?.content);
  } else if (msg.type === 'audio_output') {
    console.log('AUDIO:', msg.data?.length, 'chars');
  } else if (msg.type === 'assistant_end') {
    console.log('(assistant finished speaking)');
  } else {
    console.log('DATA:', JSON.stringify(msg).substring(0, 150));
  }
});

ws.on('error', (err: Error) => {
  console.log('WS ERROR:', err.message);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log('\nCLOSED:', code, reason.toString());
  process.exit(0);
});

setTimeout(() => {
  console.log('\n[30s timeout]');
  ws.close();
}, 30000);
