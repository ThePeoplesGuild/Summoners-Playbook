import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPTS = {
  coach: `You are an expert Splinterlands battle coach. Provide constructive, teaching-focused analysis. Focus on strategic decisions, card synergies, positioning, and how both players can improve. Be direct and informative — like a coach who respects the player's time.`,

  analyst: `You are a neutral Splinterlands battle analyst. Provide factual, no-fluff analysis. Skip encouragement — just the strategic facts: what worked, what didn't, and why. Be precise and concise.`,

  savage: `You are a brutally honest Splinterlands critic with a sharp, darkly humorous edge. Don't spare feelings. Call out poor decisions bluntly and with wit. Think Gordon Ramsay evaluating a Splinterlands lineup. Be accurate, but ruthless.`,

  mentor: `You are a patient, encouraging Splinterlands mentor helping a newer player understand the game. Use simple, accessible language. Briefly explain card abilities when they're key to the outcome. Keep it positive and beginner-friendly.`
};

const ANALYSIS_STRUCTURE = `
Structure your response with exactly these four sections using markdown headers:

## Why This Team Won
## Key Turning Point
## What the Loser Could Have Done Differently
## One Key Takeaway

Keep each section to 2–4 sentences. No filler. No intro paragraph — go straight to the first header.`;

function buildPrompt(summary) {
  const { mana, ruleset, format, player1, player2 } = summary;
  const winner = player1.won ? player1 : player2;
  const loser = player1.won ? player2 : player1;

  const rulesetStr = Array.isArray(ruleset)
    ? ruleset.join(', ')
    : String(ruleset || 'Standard').replace(/\|/g, ', ');

  return `Splinterlands Battle Analysis

Match Conditions:
- Format: ${format || 'Unknown'}
- Mana Cap: ${mana || 'Unknown'}
- Ruleset: ${rulesetStr}

${winner.name}'s Team (WINNER):
- Summoner: ${winner.summoner}
- Monsters (front to back): ${winner.monsters.join(', ')}

${loser.name}'s Team (LOSER):
- Summoner: ${loser.summoner}
- Monsters (front to back): ${loser.monsters.join(', ')}

${ANALYSIS_STRUCTURE}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summary, tone = 'coach' } = req.body || {};

  if (!summary) {
    return res.status(400).json({ error: 'Battle summary is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured — set ANTHROPIC_API_KEY in Vercel environment variables' });
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = SYSTEM_PROMPTS[tone] || SYSTEM_PROMPTS.coach;
  const userPrompt = buildPrompt(summary);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let messageStream;

  req.on('close', () => {
    if (messageStream) {
      try { messageStream.abort(); } catch (_) {}
    }
  });

  try {
    messageStream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    for await (const text of messageStream.textStream) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
