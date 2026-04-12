// Netlify Function: genera piano di allenamento settimanale via Claude AI
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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body JSON non valido' }) };
  }

  const { classifiedRuns, trainingMetrics, readinessScore, paceZones, raceGoal, weekDates } = payload;

  if (!weekDates || weekDates.length !== 7) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'weekDates deve avere 7 elementi' }) };
  }

  // ─── Helper formatters ───
  const fmtPace = (v) => {
    if (!v || !isFinite(v) || v <= 0) return '?:??';
    const m = Math.floor(v);
    const s = String(Math.round((v - m) * 60)).padStart(2, '0');
    return `${m}:${s}`;
  };
  const fmtTime = (mins) => {
    if (!mins || !isFinite(mins)) return null;
    const h = Math.floor(mins / 60);
    const m = String(Math.round(mins % 60)).padStart(2, '0');
    return h > 0 ? `${h}h${m}m` : `${m}m`;
  };

  // ─── Calcola fase ───
  const daysToRace = raceGoal?.date
    ? Math.round((new Date(raceGoal.date + 'T00:00:00') - new Date(weekDates[0] + 'T00:00:00')) / 86400000)
    : null;

  const phase = daysToRace == null ? 'load'
    : daysToRace > 14 ? 'load'
    : daysToRace > 7  ? 'taper'
    : daysToRace > 0  ? 'race_week'
    : 'post_race';

  const phaseDesc = {
    load:      'Fase di carico: massimizza stimoli allenanti, volume elevato, 2 sessioni di qualità',
    taper:     'Tapering pre-gara: riduci volume del 30-40%, mantieni 1-2 sessioni di qualità, gambe fresche',
    race_week: 'Settimana gara: volume minimo, solo attivazione leggera, NO sessioni dure, riposa molto',
    post_race: 'Post-gara: recupero completo, solo jogging leggero se le gambe lo permettono',
  }[phase] ?? 'Fase di carico';

  // ─── Formatta dati per il prompt ───
  const recentRunsStr = (classifiedRuns ?? []).slice(0, 20).map(r =>
    `- ${r.date} [${r.classification?.workoutType ?? '?'}] ${(r.distanceKm ?? 0).toFixed(1)}km @${fmtPace(r.avgPaceMinKm)}/km (effort: ${r.effortScore ?? '?'})`
  ).join('\n') || 'Nessuna corsa recente';

  const pzStr = paceZones ? [
    `Rigenerativa: ${fmtPace(paceZones.recovery?.paceMin)}–${fmtPace(paceZones.recovery?.paceMax)}/km`,
    `Facile:       ${fmtPace(paceZones.easy?.paceMin)}–${fmtPace(paceZones.easy?.paceMax)}/km`,
    `Lungo:        ${fmtPace(paceZones.longRun?.paceMin)}–${fmtPace(paceZones.longRun?.paceMax)}/km`,
    `Ritmo mezza:  ${fmtPace(paceZones.halfMarathon?.paceMin)}–${fmtPace(paceZones.halfMarathon?.paceMax)}/km`,
    `Soglia/Tempo: ${fmtPace(paceZones.tempo?.paceMin)}–${fmtPace(paceZones.tempo?.paceMax)}/km`,
    `Ripetute:     ${fmtPace(paceZones.interval?.paceMin)}–${fmtPace(paceZones.interval?.paceMax)}/km`,
  ].join('\n') : 'Zone non disponibili';

  const metricsStr = trainingMetrics ? [
    `Volume settimana corrente: ${trainingMetrics.weeklyVolumeKm ?? 0}km`,
    `Volume ultimi 30gg:        ${trainingMetrics.monthlyVolumeKm ?? 0}km`,
    `Uscite ultimi 7gg:         ${trainingMetrics.runsLast7Days ?? 0}`,
    `Passo facile medio:        ${fmtPace(trainingMetrics.avgEasyPace)}/km`,
    `Stima mezza maratona:      ${fmtTime(trainingMetrics.estimatedHalfMarathonTime) ?? 'N/D'} @${fmtPace(trainingMetrics.estimatedHalfMarathonPace)}/km`,
    `Stima 10km:                ${fmtTime(trainingMetrics.estimated10kTime) ?? 'N/D'}`,
    `Basato su:                 ${trainingMetrics.estimatedBasedOn ?? 'N/D'}`,
  ].join('\n') : 'Metriche non disponibili';

  const raceStr = raceGoal
    ? `Gara obiettivo: ${raceGoal.name} — ${raceGoal.date} — ${raceGoal.distanceKm}km — obiettivo: ${raceGoal.targetTime ?? 'non specificato'} — giorni alla gara: ${daysToRace ?? '?'}`
    : 'Nessuna gara obiettivo configurata';

  const readinessStr = readinessScore
    ? `Readiness oggi: ${readinessScore.score}/100 (${readinessScore.label})${readinessScore.flags?.length ? ' — segnali: ' + readinessScore.flags.join(', ') : ''}`
    : 'Readiness: non disponibile';

  const dayNames = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const weekScheduleStr = weekDates.map((iso, i) => `${dayNames[i]} ${iso}`).join(', ');

  const systemPrompt = `Sei un coach di corsa esperto specializzato in mezza maratona. Generi piani di allenamento settimanali personalizzati in formato JSON, basandoti sui dati reali dell'atleta.

REGOLE INDEROGABILI:
1. Massimo 2 sessioni di intensità (interval/tempo/race_pace/threshold) per settimana
2. Almeno 48h tra sessioni dure consecutive (interval, tempo, long_run)
3. Se readiness < 60, sostituisci la prima sessione intensa con easy/recovery
4. Se readiness < 40, settimana di recupero: solo easy e rest
5. Non aumentare il volume totale di più del 15% rispetto alla media storica
6. Usa SEMPRE le zone di ritmo dell'atleta (derivate da VDOT) per le prescrizioni

FASE ATTUALE: ${phaseDesc}

OUTPUT: rispondi SOLO con il JSON valido, senza testo aggiuntivo, senza markdown, senza backtick.`;

  const userMessage = `METRICHE ATLETA:
${metricsStr}

${readinessStr}

ZONE DI RITMO PERSONALIZZATE (da VDOT reale):
${pzStr}

${raceStr}

ULTIME CORSE (dal più recente al meno recente):
${recentRunsStr}

SETTIMANA DA PIANIFICARE: ${weekScheduleStr}

Genera il piano JSON con questa struttura ESATTA (7 sessioni, una per giorno):
{
  "weekTarget": <km totali sessioni non-riposo, numero intero>,
  "phase": "${phase}",
  "note": "<descrizione sintetica della settimana, max 90 caratteri>",
  "sessions": [
    {
      "isoDate": "${weekDates[0]}",
      "dayName": "Lunedì",
      "type": "<rest|recovery|easy|long_run|tempo|interval|race_pace|threshold|progression>",
      "title": "<titolo sessione, max 40 caratteri>",
      "totalKm": <numero con decimale, 0 per rest>,
      "structure": [
        {
          "phase": "<nome fase es. 'Riscaldamento' 'Km 1-8 base' '4×1km ripetute'>",
          "km": <numero>,
          "pace": "<es. '5:30–5:45/km'>",
          "speed": "<es. '10.4–10.9 km/h'>",
          "recovery": "<opzionale, solo per interval: es. 'rec: 90s jog'>"
        }
      ],
      "garminNote": "<istruzione breve per Garmin, max 60 caratteri, stringa vuota per rest>",
      "rationale": "<perché questa sessione, max 100 caratteri>"
    }
  ]
}

IMPORTANTE: genera esattamente 7 sessioni nell'ordine ${weekDates[0]} (Lunedì) → ${weekDates[6]} (Domenica).`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: data.error?.message ?? JSON.stringify(data) }) };
    }

    const rawText = data.content?.[0]?.text ?? '';

    // Parsing difensivo
    let plan;
    try {
      plan = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        return { statusCode: 422, headers, body: JSON.stringify({ error: 'Claude non ha restituito JSON valido', raw: rawText.slice(0, 500) }) };
      }
      try {
        plan = JSON.parse(match[0]);
      } catch (e2) {
        return { statusCode: 422, headers, body: JSON.stringify({ error: 'JSON non parseable: ' + e2.message, raw: rawText.slice(0, 500) }) };
      }
    }

    // Validazione minima
    if (!plan || !Array.isArray(plan.sessions) || plan.sessions.length !== 7) {
      return { statusCode: 422, headers, body: JSON.stringify({ error: `Piano AI non valido: sessions ha ${plan?.sessions?.length ?? 0} elementi (attesi 7)`, raw: rawText.slice(0, 500) }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ plan }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
