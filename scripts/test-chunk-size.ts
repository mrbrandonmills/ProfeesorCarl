// Test: 20ms chunks at 44100Hz = 44100 * 0.020 * 2 bytes = 1764 bytes per chunk
// Test what happens with small chunks

import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

console.log('TEST: Small 20ms audio chunks (Hume recommended)');
console.log('44100Hz * 20ms * 2 bytes = 1764 bytes per chunk');
console.log('='.repeat(60));

const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[CONNECTED]');
  
  // Send session_settings
  ws.send(JSON.stringify({
    type: 'session_settings',
    audio: { encoding: 'linear16', sample_rate: 44100, channels: 1 },
  }));
  console.log('[SENT] session_settings');
  
  // Generate a 440Hz tone (A4 note) as test audio
  // This is audible audio that should trigger speech detection (or at least audio detection)
  const sampleRate = 44100;
  const chunkDuration = 0.020; // 20ms
  const samplesPerChunk = Math.floor(sampleRate * chunkDuration); // 882 samples
  const bytesPerChunk = samplesPerChunk * 2; // 1764 bytes (16-bit)
  
  console.log('Chunk size:', bytesPerChunk, 'bytes =', samplesPerChunk, 'samples');
  
  let chunksSent = 0;
  let t = 0;
  
  const sendChunk = () => {
    const chunk = Buffer.alloc(bytesPerChunk);
    
    // Generate sine wave tone
    for (let i = 0; i < samplesPerChunk; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * (t + i / sampleRate)) * 16000;
      chunk.writeInt16LE(Math.round(sample), i * 2);
    }
    t += samplesPerChunk / sampleRate;
    
    ws.send(JSON.stringify({
      type: 'audio_input',
      data: chunk.toString('base64'),
    }));
    chunksSent++;
  };
  
  // Send for 3 seconds (150 chunks at 20ms each)
  const interval = setInterval(() => {
    sendChunk();
    if (chunksSent >= 150) {
      clearInterval(interval);
      console.log('[SENT]', chunksSent, 'chunks (3 seconds of tone)');
    }
  }, 20);
  
  setTimeout(() => ws.close(), 10000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  const ts = new Date().toISOString().split('T')[1].substring(0, 8);
  
  if (msg.type === 'error') {
    console.log('[' + ts + '] ERROR:', msg.code, msg.message);
  } else if (msg.type === 'user_message') {
    console.log('[' + ts + '] user_message - Speech detected!');
    console.log('  Content:', msg.message?.content);
  } else if (msg.type === 'assistant_message') {
    console.log('[' + ts + '] CARL:', msg.message?.content);
  } else if (msg.type === 'audio_output') {
    console.log('[' + ts + '] audio_output received');
  } else if (msg.type === 'tool_call') {
    console.log('[' + ts + '] tool_call:', msg.name);
    ws.send(JSON.stringify({
      type: 'tool_response',
      tool_call_id: msg.tool_call_id,
      content: 'Context loaded.',
    }));
  } else {
    console.log('[' + ts + ']', msg.type);
  }
});

ws.on('close', () => process.exit(0));
