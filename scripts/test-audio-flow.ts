import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

async function testAudioFlow() {
  console.log('='.repeat(60));
  console.log('TESTING EXACT MOBILE APP FLOW');
  console.log('='.repeat(60));
  
  const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
  console.log('\n1. Connecting to Hume EVI...');
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('2. Connected! Sending session_settings...');
    
    const sessionSettings = {
      type: 'session_settings',
      audio: {
        format: 'linear16',
        sample_rate: 44100,
        channels: 1,
      },
    };
    ws.send(JSON.stringify(sessionSettings));
    console.log('   Sent:', JSON.stringify(sessionSettings));
    
    setTimeout(() => {
      console.log('\n3. Sending test audio (1 second of silence)...');
      const silenceBuffer = Buffer.alloc(88200, 0);
      const base64Audio = silenceBuffer.toString('base64');
      
      const audioMsg = {
        type: 'audio_input',
        data: base64Audio,
      };
      ws.send(JSON.stringify(audioMsg));
      console.log('   Sent audio_input: ' + base64Audio.length + ' chars base64');
      
      setTimeout(() => {
        ws.send(JSON.stringify(audioMsg));
        console.log('   Sent another audio chunk');
      }, 500);
      
    }, 1000);
    
    setTimeout(() => {
      console.log('\n5. Test complete, closing...');
      ws.close();
    }, 15000);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log('\n[MSG] ' + msg.type);
      
      if (msg.type === 'error') {
        console.log('   ERROR CODE:', msg.code);
        console.log('   ERROR MESSAGE:', msg.message);
        console.log('   FULL ERROR:', JSON.stringify(msg, null, 2));
      } else if (msg.type === 'chat_metadata') {
        console.log('   Chat ID:', msg.chat_id);
      } else if (msg.type === 'user_message') {
        console.log('   Transcript:', msg.message?.content);
      } else if (msg.type === 'assistant_message') {
        const content = msg.message?.content || '';
        console.log('   Carl says:', content.substring(0, 100));
      } else if (msg.type === 'audio_output') {
        const audioLen = msg.data?.length || 0;
        console.log('   Audio received:', audioLen, 'chars');
      } else if (msg.type === 'tool_call') {
        console.log('   Tool:', msg.name);
        console.log('   Tool call ID:', msg.tool_call_id);
        const toolResponse = {
          type: 'tool_response',
          tool_call_id: msg.tool_call_id,
          content: 'No prior context available.',
        };
        ws.send(JSON.stringify(toolResponse));
        console.log('   Sent tool response');
      } else {
        const str = JSON.stringify(msg);
        console.log('   Data:', str.substring(0, 200));
      }
    } catch (e) {
      const str = data.toString();
      console.log('[RAW]', str.substring(0, 200));
    }
  });
  
  ws.on('error', (error) => {
    console.error('\n[WEBSOCKET ERROR]', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log('\n[CLOSED] Code: ' + code + ', Reason: ' + reason);
    process.exit(0);
  });
}

testAudioFlow();
