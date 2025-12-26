import * as dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.HUME_API_KEY;
const configId = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('=== FULL HUME FLOW TEST ===\n');

const url = `wss://api.hume.ai/v0/evi/chat?apiKey=${apiKey}&config_id=${configId}`;
const ws = new WebSocket(url);

let messageCount = 0;

ws.on('open', () => {
  console.log('✓ Connected\n');
  
  // Send audio after 1 second
  setTimeout(() => {
    console.log('Sending audio...');
    // Generate actual PCM audio (a simple tone)
    const sampleRate = 16000;
    const duration = 0.5; // 500ms
    const samples = sampleRate * duration;
    const buffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
    
    for (let i = 0; i < samples; i++) {
      // Generate a 440Hz sine wave
      const value = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000;
      buffer.writeInt16LE(Math.round(value), i * 2);
    }
    
    ws.send(JSON.stringify({
      type: 'audio_input',
      data: buffer.toString('base64'),
    }));
    console.log('Sent', buffer.length, 'bytes of audio\n');
  }, 1000);
});

ws.on('message', (data: Buffer) => {
  messageCount++;
  const msg = JSON.parse(data.toString());
  
  console.log(`[${messageCount}] ${msg.type}`);
  
  if (msg.type === 'error') {
    console.log('  CODE:', msg.code);
    console.log('  MESSAGE:', msg.message);
    console.log('  FULL:', JSON.stringify(msg, null, 2));
  } else if (msg.type === 'chat_metadata') {
    console.log('  chat_id:', msg.chat_id);
  } else if (msg.type === 'user_message') {
    console.log('  transcript:', msg.message?.content);
  } else if (msg.type === 'assistant_message') {
    console.log('  content:', msg.message?.content?.substring(0, 100));
  } else if (msg.type === 'audio_output') {
    console.log('  audio bytes:', msg.data?.length);
  } else if (msg.type === 'tool_call') {
    console.log('  tool:', msg.name);
    console.log('  id:', msg.tool_call_id);
    console.log('  params:', msg.parameters);
    
    // Send tool response
    setTimeout(() => {
      console.log('\n  Sending tool response...');
      ws.send(JSON.stringify({
        type: 'tool_response',
        tool_call_id: msg.tool_call_id,
        content: 'No prior context yet. This is a fresh conversation.',
      }));
    }, 100);
  } else if (msg.type === 'tool_error') {
    console.log('  TOOL ERROR:', JSON.stringify(msg, null, 2));
  } else {
    console.log('  data:', JSON.stringify(msg, null, 2).substring(0, 200));
  }
});

ws.on('error', (err: Error) => {
  console.log('\n✗ WS ERROR:', err.message);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log('\n=== CLOSED ===');
  console.log('Code:', code);
  console.log('Reason:', reason.toString() || '(none)');
  process.exit(0);
});

setTimeout(() => {
  console.log('\n[60s timeout]');
  ws.close();
}, 60000);
