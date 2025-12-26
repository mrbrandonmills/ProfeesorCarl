import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

async function checkConfig() {
  console.log('Fetching config from Hume API...\n');
  
  const response = await fetch(`https://api.hume.ai/v0/evi/configs/${CONFIG_ID}`, {
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
    },
  });

  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Raw response:\n', text);
}

checkConfig().catch(console.error);
