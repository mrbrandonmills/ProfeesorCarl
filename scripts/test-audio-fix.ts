import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

async function testAudioFlow() {
  console.log('TESTING WITH CORRECT FIELD: encoding (not format)');
  
  const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('Connected! Sending session_settings with encoding field...');
    
    const sessionSettings = {
      type: 'session_settings',
      audio: {
        encoding: 'linear16',  // CORRECT FIELD NAME
        sample_rate: 44100,
        channels: 1,
      },
    };
    ws.send(JSON.stringify(sessionSettings));
    console.log('Sent:', JSON.stringify(sessionSettings));
    
    setTimeout(() => {
      console.log('\nSending test audio...');
      const silenceBuffer = Buffer.alloc(88200, 0);
      const audioMsg = {
        type: 'audio_input',
        data: silenceBuffer.toString('base64'),
      };
      ws.send(JSON.stringify(audioMsg));
      console.log('Sent audio');
    }, 500);
    
    setTimeout(() => {
      ws.close();
    }, 10000);
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('\n[' + msg.type + ']');
    if (msg.type === 'error') {
      console.log('ERROR:', msg.message);
    } else if (msg.type === 'tool_call') {
      console.log('Tool:', msg.name);
      ws.send(JSON.stringify({
        type: 'tool_response',
        tool_call_id: msg.tool_call_id,
        content: 'No context.',
      }));
    } else if (msg.type === 'assistant_message') {
      console.log('Carl:', (msg.message?.content || '').substring(0, 80));
    } else if (msg.type === 'audio_output') {
      console.log('Audio chunk received!');
    }
  });
  
  ws.on('close', () => {
    console.log('\nDone');
    process.exit(0);
  });
}

testAudioFlow();
