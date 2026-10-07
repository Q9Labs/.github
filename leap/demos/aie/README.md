# AI Everything demos

Isolated static demo launcher for https://demos.q9labs.ai. The original parent project and Worker are unchanged.

Run `pnpm build`, then `wrangler deploy`. Local product walkthroughs are precached on the first online visit; Mesa, Terminal, and the Ava live voice link require internet.

The home page runs an attract loop when idle (`public/attract.js`). Its kiosk lines live in `public/assets/voice/voice-lines.json`; regenerate the Yasser MP3s with `node --env-file=/path/to/.env.local scripts/generate-voice.mjs --force` (needs `CARTESIA_API_KEY` and ffmpeg).
