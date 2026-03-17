# Splinterlands Battle Analyzer

AI-powered battle breakdown for Splinterlands. Paste any battle URL and get instant analysis.

## Features

- Paste any Splinterlands battle URL or raw ID
- Four AI analysis tones: Coach, Analyst, Savage, Mentor
- Streaming AI analysis powered by Claude
- Shareable links with battle ID + tone baked in
- Automatic card name resolution via Splinterlands card API

## Supported URL Formats

```
https://splinterlands.com/battle/sl_6a6f7c69a5d20dc10056fb7775d97bba
https://splinterlands.com/battle/sl_6a6f7c69a5d20dc10056fb7775d97bba?ref=bjangles
https://splinterlands.com/?p=battle&id=sm_abc123
sl_abc123...   (raw ID)
sm_abc123...   (raw ID)
```

## Project Structure

```
battle-analyzer/
├── api/
│   ├── battle.js      # Proxy → api2.splinterlands.com/battle/result
│   ├── history.js     # Proxy → api2.splinterlands.com/battle/history
│   ├── cards.js       # Proxy → api2.splinterlands.com/cards/get_details
│   └── analyze.js     # Claude API streaming analysis
├── public/
│   └── index.html     # Full frontend (single file, no framework)
├── vercel.json        # Routing — API routes bypass static rewrite
├── package.json       # Node 20.x, @anthropic-ai/sdk
└── README.md
```

## Deploy to Vercel

1. Fork or clone this repo
2. Import the `battle-analyzer/` directory into Vercel
3. Add environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
4. Deploy

Vercel auto-detects the serverless functions in `api/` and serves `public/index.html` for all other routes.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

## Vercel Routing

The `vercel.json` rewrite rule sends all non-`/api/` paths to `index.html`:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/public/index.html" }
  ]
}
```

To verify the proxy works after deploy, hit `/api/battle?id=sl_6a6f7c69a5d20dc10056fb7775d97bba` directly — it should return JSON, not HTML.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/battle?id=BATTLE_ID` | Fetch battle result |
| `GET /api/history?player=USERNAME&limit=10` | Fetch player's recent battles |
| `GET /api/cards` | Full card list (cached 1hr) |
| `POST /api/analyze` | Stream AI analysis (SSE) |

### POST /api/analyze

**Request body:**
```json
{
  "summary": {
    "mana": 30,
    "ruleset": ["Standard"],
    "format": "Modern",
    "player1": { "name": "player1", "won": true, "summoner": "Kelya Frendul", "monsters": ["Diemonshark", "Deeplurker"] },
    "player2": { "name": "player2", "won": false, "summoner": "Tarsa", "monsters": ["Tenyii Striker"] }
  },
  "tone": "coach"
}
```

**Response:** `text/event-stream` (SSE)
```
data: {"text":"## Why This Team Won\n"}
data: {"text":"Kelya Frendul's speed buff..."}
...
data: [DONE]
```
