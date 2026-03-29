// Netlify Function: proxy Claude API
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurata' }) };
  }

  const { messages, activities, runningContext } = JSON.parse(event.body || '{}');

  const activitySummary = activities?.length
    ? activities.slice(0, 10).map(a => {
        const date = new Date(a.start_date).toLocaleDateString('it-IT');
        const dist = a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '';
        const dur = a.moving_time ? `${Math.round(a.moving_time / 60)} min` : '';
        const kcal = a.calories ? `${a.calories} kcal` : '';
        return `- ${date}: ${a.type} ${dist} ${dur} ${kcal}`.trim();
      }).join('\n')
    : 'Nessuna attività disponibile';

  const systemPrompt = `Sei un coach sportivo personale esperto di corsa su strada. Aiuti l'utente a pianificare gli allenamenti in base alla sua storia sportiva su Strava.

Ultime attività Strava:
${activitySummary}
${runningContext ? '\n' + runningContext : ''}
Rispondi in italiano, in modo conciso e pratico. Suggerisci allenamenti con distanze, tempi e intensità specifiche. Quando l'utente chiede stime di gara, usa i dati forniti nell'analisi corsa se disponibili.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages || [],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify({ error: data.error?.message || JSON.stringify(data) }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
