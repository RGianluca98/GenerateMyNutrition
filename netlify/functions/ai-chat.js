// Netlify Function: proxy AI — usa OpenAI GPT-4o-mini (fallback Claude)
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { messages, activities } = JSON.parse(event.body || '{}');

  const activitySummary = activities?.length
    ? activities.slice(0, 10).map(a => {
        const date = new Date(a.start_date).toLocaleDateString('it-IT');
        const dist = a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '';
        const dur = a.moving_time ? `${Math.round(a.moving_time / 60)} min` : '';
        const kcal = a.calories ? `${a.calories} kcal` : '';
        return `- ${date}: ${a.type} ${dist} ${dur} ${kcal}`.trim();
      }).join('\n')
    : 'Nessuna attività disponibile';

  const systemPrompt = `Sei un coach sportivo personale. Aiuti l'utente a pianificare gli allenamenti in base alla sua storia sportiva su Strava.

Ultime attività Strava:
${activitySummary}

Rispondi in italiano, in modo conciso e pratico. Suggerisci allenamenti con distanze, tempi e intensità specifiche.`;

  // Prova prima OpenAI, poi Claude come fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || []),
      ];
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          messages: openaiMessages,
        }),
      });
      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        // Normalizza risposta nello stesso formato di Claude
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            content: [{ type: 'text', text: data.choices[0].message.content }],
          }),
        };
      }
      // Se OpenAI fallisce, logga e prova Claude
      console.error('OpenAI error:', JSON.stringify(data));
    } catch (err) {
      console.error('OpenAI fetch error:', err.message);
    }
  }

  // Fallback: Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages || [],
        }),
      });
      const data = await res.json();
      if (res.ok) return { statusCode: 200, headers, body: JSON.stringify(data) };
      console.error('Claude error:', JSON.stringify(data));
      return { statusCode: res.status, headers, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Nessuna API key AI configurata (OPENAI_API_KEY o ANTHROPIC_API_KEY)' }) };
};
