import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('DEBUG: Full flow test');
console.log('='.repeat(60));

const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[OPEN] Connected');
  
  // Send session_settings
  ws.send(JSON.stringify({
    type: 'session_settings',
    audio: {
      encoding: 'linear16',
      sample_rate: 44100,
      channels: 1,
    },
  }));
  console.log('[SENT] session_settings');
  
  // Send audio for 3 seconds
  let count = 0;
  const interval = setInterval(() => {
    const buf = Buffer.alloc(4410, 0);
    ws.send(JSON.stringify({ type: 'audio_input', data: buf.toString('base64') }));
    count++;
    if (count >= 60) {
      clearInterval(interval);
      console.log('[SENT] 3 seconds of audio');
    }
  }, 50);
  
  setTimeout(() => {
    console.log('\n[CLOSING]');
    ws.close();
  }, 12000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  
  if (msg.type === 'error') {
    console.log('\n[' + ts + '] ERROR:', msg.code, '-', msg.message);
  } else if (msg.type === 'chat_metadata') {
    console.log('[' + ts + '] chat_metadata - Chat started');
  } else if (msg.type === 'user_message') {
    console.log('[' + ts + '] user_message:', msg.message?.content);
    if (msg.models?.prosody) {
      console.log('   prosody detected (engagement tracking)');
    }
  } else if (msg.type === 'assistant_message') {
    console.log('[' + ts + '] CARL:', msg.message?.content);
  } else if (msg.type === 'audio_output') {
    console.log('[' + ts + '] audio_output - Carl speaking!');
  } else if (msg.type === 'tool_call') {
    console.log('[' + ts + '] tool_call:', msg.name, '- ID:', msg.tool_call_id);
    // Send response
    ws.send(JSON.stringify({
      type: 'tool_response',
      tool_call_id: msg.tool_call_id,
      content: 'Brandon is building Professor Carl.',
    }));
    console.log('[' + ts + '] tool_response sent');
  } else if (msg.type === 'tool_error') {
    console.log('[' + ts + '] TOOL ERROR:', JSON.stringify(msg));
  } else if (msg.type === 'assistant_end') {
    console.log('[' + ts + '] assistant_end');
  } else {
    console.log('[' + ts + ']', msg.type, JSON.stringify(msg).substring(0, 100));
  }
});

ws.on('error', (e) => console.log('[WS ERROR]', e.message));
ws.on('close', (code) => {
  console.log('[CLOSED] Code:', code);
  process.exit(0);
});
