/**
 * COMPREHENSIVE VOICE FLOW TEST
 * Tests: Connection → Session Settings → Text Input → Tool Calls → Memory → Response
 */

import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY!;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';
const BACKEND_URL = 'https://profeesor-carl.vercel.app';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];
let ws: WebSocket;

function log(msg: string) {
  const ts = new Date().toISOString().split('T')[1].substring(0, 8);
  console.log('[' + ts + '] ' + msg);
}

function addResult(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  log(icon + ' ' + name + ': ' + details);
}

async function testBackendEndpoints() {
  log('='.repeat(60));
  log('TEST 1: Backend Memory Endpoints');
  log('='.repeat(60));
  
  // Test /api/memory/context
  try {
    const res = await fetch(BACKEND_URL + '/api/memory/context?user_id=brandon&depth=standard');
    const data = await res.json();
    if (data.success && data.context) {
      addResult('Memory Context Endpoint', true, 'Returns context with ' + (data.context.userFacts?.length || 0) + ' facts');
    } else {
      addResult('Memory Context Endpoint', false, 'Unexpected response: ' + JSON.stringify(data).substring(0, 100));
    }
  } catch (e: any) {
    addResult('Memory Context Endpoint', false, 'Error: ' + e.message);
  }
  
  // Test /api/memory/process (simple save)
  try {
    const res = await fetch(BACKEND_URL + '/api/memory/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_voice_flow',
        type: 'carl',
        content: 'Test memory from voice flow test at ' + new Date().toISOString(),
        category: 'test_insight',
        source: 'voice_flow_test',
      }),
    });
    const data = await res.json();
    if (data.success) {
      addResult('Memory Process (Simple Save)', true, 'Saved with strength ' + (data.memoryStrength?.toFixed(2) || 'N/A'));
    } else {
      addResult('Memory Process (Simple Save)', false, 'Error: ' + (data.error || JSON.stringify(data)));
    }
  } catch (e: any) {
    addResult('Memory Process (Simple Save)', false, 'Error: ' + e.message);
  }
}

async function testHumeVoiceFlow(): Promise<void> {
  return new Promise((resolve) => {
    log('');
    log('='.repeat(60));
    log('TEST 2: Hume EVI Voice Flow');
    log('='.repeat(60));
    
    const url = 'wss://api.hume.ai/v0/evi/chat?apiKey=' + HUME_API_KEY + '&config_id=' + CONFIG_ID;
    ws = new WebSocket(url);
    
    let gotChatMetadata = false;
    let gotAssistantMessage = false;
    let gotAudioOutput = false;
    let gotToolCall = false;
    let toolCallHandled = false;
    
    const timeout = setTimeout(() => {
      addResult('Voice Flow Timeout', false, 'Test timed out after 20 seconds');
      ws.close();
      resolve();
    }, 20000);
    
    ws.on('open', () => {
      log('WebSocket connected');
      addResult('WebSocket Connection', true, 'Connected to Hume EVI');
      
      // Send session_settings
      ws.send(JSON.stringify({
        type: 'session_settings',
        audio: { encoding: 'linear16', sample_rate: 48000, channels: 1 },
      }));
      log('Sent session_settings (48000Hz)');
      
      // Send text input after a moment
      setTimeout(() => {
        log('Sending text: "Hello Professor Carl, this is a test"');
        ws.send(JSON.stringify({
          type: 'user_input',
          text: 'Hello Professor Carl, this is a test of memory and voice.',
        }));
      }, 500);
    });
    
    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());
      
      switch (msg.type) {
        case 'chat_metadata':
          gotChatMetadata = true;
          addResult('Chat Metadata', true, 'Chat ID: ' + msg.chat_id?.substring(0, 8));
          break;
          
        case 'user_message':
          log('User message received: ' + (msg.message?.content || '').substring(0, 50));
          break;
          
        case 'assistant_message':
          gotAssistantMessage = true;
          const content = msg.message?.content || '';
          addResult('Assistant Response', true, 'Carl says: "' + content.substring(0, 60) + '..."');
          break;
          
        case 'audio_output':
          if (!gotAudioOutput) {
            gotAudioOutput = true;
            const audioLen = msg.data?.length || 0;
            addResult('Audio Output', true, 'Received audio: ' + audioLen + ' base64 chars');
          }
          break;
          
        case 'tool_call':
          gotToolCall = true;
          log('Tool call: ' + msg.name);
          addResult('Tool Call', true, 'Tool: ' + msg.name);
          
          // Send tool response
          setTimeout(() => {
            const response = {
              type: 'tool_response',
              tool_call_id: msg.tool_call_id,
              content: msg.name === 'get_conversation_context' 
                ? 'Brandon is building Professor Carl. He has a UCSD speaking event coming up.'
                : 'Memory operation completed.',
            };
            ws.send(JSON.stringify(response));
            toolCallHandled = true;
            addResult('Tool Response', true, 'Sent response for ' + msg.name);
          }, 100);
          break;
          
        case 'error':
          addResult('Hume Error', false, msg.code + ': ' + msg.message);
          break;
      }
    });
    
    ws.on('error', (e) => {
      addResult('WebSocket Error', false, e.message);
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      
      // Summary
      log('');
      log('='.repeat(60));
      log('Voice Flow Summary:');
      log('  Chat metadata: ' + (gotChatMetadata ? 'YES' : 'NO'));
      log('  Assistant message: ' + (gotAssistantMessage ? 'YES' : 'NO'));
      log('  Audio output: ' + (gotAudioOutput ? 'YES' : 'NO'));
      log('  Tool call: ' + (gotToolCall ? 'YES' : 'NO'));
      log('  Tool handled: ' + (toolCallHandled ? 'YES' : 'NO'));
      log('='.repeat(60));
      
      resolve();
    });
    
    // Close after 15 seconds
    setTimeout(() => {
      ws.close();
    }, 15000);
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     PROFESSOR CARL VOICE FLOW COMPREHENSIVE TEST         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  await testBackendEndpoints();
  await testHumeVoiceFlow();
  
  // Final summary
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL RESULTS                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log('');
  for (const r of results) {
    console.log((r.passed ? '✅' : '❌') + ' ' + r.name);
  }
  console.log('');
  console.log('PASSED: ' + passed + '/' + total + ' (' + Math.round(passed/total*100) + '%)');
  console.log('');
  
  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);
