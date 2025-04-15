process.on('uncaughtException', (err) => {
  require('fs').writeFileSync('crashlog.txt', '[INDEX.JS ERROR]\n' + err.stack);
});

const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Configuration, OpenAIApi } = require('openai');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
const {
  twitch_oauth,
  twitch_channel,
  openai_key,
  google_credentials,
  voice_id,
  aliases,
  custom_prompt,
  model
} = config;

// Google Cloud TTS setup
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: google_credentials
});

// OpenAI setup
const openai = new OpenAIApi(new Configuration({ apiKey: openai_key }));

// Personality triggers
const personalityTriggers = {
  flirty: ['cute', 'love', 'baby', 'kiss', 'date'],
  sarcastic: ['oh sure', 'wow', 'nice try', 'obviously', 'yeah right'],
  roast: ['idiot', 'dumb', 'bad', 'fail', 'trash']
};

let botRunning = false;
let cooldown = false;
let greeted = new Set();

const clientTMI = new tmi.Client({
  options: { debug: true },
  identity: {
    username: twitch_channel,
    password: twitch_oauth
  },
  channels: [twitch_channel]
});

// Determine personality
function getPersonality(message) {
  const lowered = message.toLowerCase();
  for (const type in personalityTriggers) {
    if (personalityTriggers[type].some(word => lowered.includes(word))) {
      return type;
    }
  }
  return 'default';
}

// Speak with Google Cloud TTS
async function speak(text) {
  const request = {
    input: { text },
    voice: { name: voice_id || 'en-US-Studio-M', languageCode: 'en-US' },
    audioConfig: { audioEncoding: 'MP3' }
  };

  const [response] = await client.synthesizeSpeech(request);
  const outputFile = 'output.mp3';
  fs.writeFileSync(outputFile, response.audioContent, 'binary');

  exec(`"C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" ${outputFile} --play-and-exit --intf dummy`, (err) => {
    if (err) console.error('VLC error:', err);
  });
}

// Get GPT reply
async function getReply(username, message, personality) {
  const prompt = `${custom_prompt || ''}\n\n[Personality: ${personality}]\n[User: ${username}]\n[Message: ${message}]\n[Bot:]`;

  const res = await openai.createChatCompletion({
    model: model || 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  return res.data.choices[0].message.content.trim();
}

// Handle chat
clientTMI.on('message', async (channel, tags, message, self) => {
  if (!botRunning || self || cooldown) return;

  const username = tags.username;
  const msgLower = message.toLowerCase();

  // Greet specific users lovingly
  const greetUsers = ['addison2k', 'bubbleyheather', 'krystalbella', 'provos', 'robx', 'scymplex', 'mousey41', 'sparkleaf', 'llunnettik', 'kizzybebe', 'acidk'];
  if (greetUsers.includes(username) && !greeted.has(username)) {
    greeted.add(username);
    const greeting = `Welcome back, ${username}~ I've missed you 💕`;
    clientTMI.say(channel, greeting);
    await speak(greeting);
    return;
  }

  // Check if bot is mentioned
  const mentioned = aliases.some(alias => msgLower.includes(alias.toLowerCase()));
  if (!mentioned) return;

  cooldown = true;
  setTimeout(() => { cooldown = false; }, 30000);

  const personality = getPersonality(message);
  const reply = await getReply(username, message, personality);
  clientTMI.say(channel, reply);
  await speak(reply);
});

// Control functions
function startBot() {
  if (!botRunning) {
    clientTMI.connect();
    botRunning = true;
    console.log('✅ Bot started');
  }
}

function stopBot() {
  if (botRunning) {
    clientTMI.disconnect();
    botRunning = false;
    console.log('🛑 Bot stopped');
  }
}

function restartBot() {
  stopBot();
  setTimeout(startBot, 1000);
}

// IPC control (from Electron)
if (process.send) {
  process.on('message', (msg) => {
    if (msg === 'start') startBot();
    if (msg === 'stop') stopBot();
    if (msg === 'restart') restartBot();
  });
} else {
  startBot(); // Standalone mode
}
