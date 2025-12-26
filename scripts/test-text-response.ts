import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('TEST: Text input to see Carl response and tool calls');
console.log('='.repeat(60));

const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[CONNECTED]');
  
  // Wait a moment then send text
  setTimeout(() => {
    console.log('\n[SENDING] Text: "Hello Professor Carl"');
    ws.send(JSON.stringify({
      type: 'user_input',
      text: 'Hello Professor Carl',
    }));
  }, 500);
  
  setTimeout(() => ws.close(), 15000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  const ts = new Date().toISOString().split('T')[1].substring(0, 8);
  
  console.log('\n[' + ts + '] ' + msg.type);
  
  if (msg.type === 'error') {
    console.log('  CODE:', msg.code);
    console.log('  MSG:', msg.message);
  } else if (msg.type === 'tool_call') {
    console.log('  TOOL:', msg.name);
    console.log('  ID:', msg.tool_call_id);
    console.log('  PARAMS:', JSON.stringify(msg.parameters));
    
    // Send tool response
    setTimeout(() => {
      console.log('\n[SENDING] tool_response for', msg.name);
      ws.send(JSON.stringify({
        type: 'tool_response',
        tool_call_id: msg.tool_call_id,
        content: 'Brandon is a cognitive science researcher building Professor Carl.',
      }));
    }, 100);
  } else if (msg.type === 'assistant_message') {
    console.log('  CARL:', msg.message?.content);
  } else if (msg.type === 'audio_output') {
    console.log('  AUDIO: ' + (msg.data?.length || 0) + ' chars');
  } else if (msg.type === 'tool_error') {
    console.log('  TOOL ERROR:', msg.error);
  }
});

ws.on('close', (code) => {
  console.log('\n[CLOSED] Code:', code);
  process.exit(0);
});
