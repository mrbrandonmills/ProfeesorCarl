import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

async function testAudioFlow() {
  console.log('FULL AUDIO TEST WITH encoding FIELD');
  
  const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
  const ws = new WebSocket(url);
  let audioChunksReceived = 0;
  
  ws.on('open', () => {
    console.log('Connected!');
    
    // Send session_settings with CORRECT field name
    ws.send(JSON.stringify({
      type: 'session_settings',
      audio: {
        encoding: 'linear16',
        sample_rate: 44100,
        channels: 1,
      },
    }));
    console.log('Sent session_settings');
    
    // Send audio chunks continuously for 5 seconds
    let chunks = 0;
    const interval = setInterval(() => {
      const audioBuffer = Buffer.alloc(4410, 0); // 50ms of audio
      ws.send(JSON.stringify({
        type: 'audio_input',
        data: audioBuffer.toString('base64'),
      }));
      chunks++;
      if (chunks >= 100) { // 5 seconds
        clearInterval(interval);
        console.log('Sent 5 seconds of audio');
      }
    }, 50);
    
    setTimeout(() => {
      console.log('\nTest complete. Audio chunks received:', audioChunksReceived);
      ws.close();
    }, 15000);
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    
    if (msg.type === 'error') {
      console.log('\nERROR:', msg.code, msg.message);
    } else if (msg.type === 'tool_call') {
      console.log('\n[TOOL]', msg.name);
      ws.send(JSON.stringify({
        type: 'tool_response',
        tool_call_id: msg.tool_call_id,
        content: 'Brandon is building Professor Carl, an AI tutoring system.',
      }));
      console.log('Sent tool response');
    } else if (msg.type === 'assistant_message') {
      console.log('\n[CARL]', (msg.message?.content || '').substring(0, 100));
    } else if (msg.type === 'audio_output') {
      audioChunksReceived++;
      if (audioChunksReceived === 1) {
        console.log('\n[AUDIO] First audio chunk received!');
      }
    } else if (msg.type === 'user_message') {
      console.log('\n[USER TRANSCRIPT]', msg.message?.content);
    }
  });
  
  ws.on('error', (e) => console.log('WS Error:', e.message));
  ws.on('close', () => process.exit(0));
}

testAudioFlow();
