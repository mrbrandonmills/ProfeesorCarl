import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const HUME_API_KEY = process.env.HUME_API_KEY;
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136';

async function checkConfig() {
  console.log('Fetching config details from Hume API...\n');
  
  const response = await fetch(`https://api.hume.ai/v0/evi/configs/${CONFIG_ID}`, {
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
    },
  });

  if (!response.ok) {
    console.error('Error:', await response.text());
    return;
  }

  const config = await response.json();
  
  console.log('Config Name:', config.name);
  console.log('Version:', config.version);
  console.log('EVI Version:', config.evi_version);
  console.log('');
  console.log('Language Model:');
  console.log('  Provider:', config.language_model?.model_provider);
  console.log('  Resource:', config.language_model?.model_resource);
  console.log('');
  console.log('Voice:');
  console.log('  Provider:', config.voice?.provider);
  console.log('  Name:', config.voice?.name);
  console.log('');
  console.log('Tools:', config.tools?.length || 0, 'configured');
  if (config.tools) {
    config.tools.forEach((t: any) => console.log('  -', t.id, 'v' + t.version));
  }
  console.log('');
  console.log('Prompt length:', config.prompt?.text?.length || 0, 'chars');
}

checkConfig().catch(console.error);
