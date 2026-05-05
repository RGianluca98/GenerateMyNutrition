# KRONOS: Nutrizione & Sport

**KRONOS** è una web app personale per il monitoraggio integrato di allenamento e nutrizione, pensata per atleti amatoriali che vogliono gestire carico di allenamento, piani alimentari e progressi fisici in un unico posto.

🌐 **Live:** [kronos-webapp.netlify.app](https://kronos-webapp.netlify.app)

---

## Funzionalità

### Home
- Dashboard giornaliera con data, tipo di giornata e badge attività
- **Readiness Score** (0–100): indice di forma calcolato su fatica accumulata e recupero
- Volume settimanale con percentuale sul target
- Prossima sessione di allenamento pianificata
- Banner conto alla rovescia per la gara obiettivo
- Calendario mensile allenamenti

### Allenamento
- Integrazione **Strava OAuth** per importare automaticamente le attività
- Classificazione automatica delle corse (Easy, Tempo, Soglia, Interval, Lungo, Recovery, Gara)
- **Running Insights Panel**: ultima corsa, andamento settimanale su 10 settimane, stima tempo gara
- Calcolo **VDOT** e zone di ritmo personalizzate
- Piano settimanale generato da **AI (Claude Sonnet)** basato su storico corse e obiettivo gara
- Coach AI via chat per consigli di allenamento personalizzati

### Nutrizione
- Piano alimentare settimanale strutturato per tipo di giornata (Riposo / Corsa / Calcio)
- Tracciamento pasti giornaliero con spunta degli alimenti consumati
- Calcolo kcal consumate vs target, integrato con kcal bruciate da Strava
- Modifica quantità, swap alimenti, aggiunta cibi extra
- Salvataggio ricette personalizzate

### Piano settimanale
- Compliance settimanale giornaliera
- Monitoraggio limiti di consumo settimanale per categoria alimentare (carni, pesce, carboidrati, latticini, ecc.)

### Ricettario
- Creazione e gestione ricette personali
- Applicazione rapida di una ricetta a un pasto specifico

### Peso
- Log pesate con data
- Grafico andamento peso nel tempo
- Delta peso dall'inizio del periodo

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Frontend | React 18 (via CDN), Babel standalone |
| Styling | CSS-in-JS inline + CSS injection dinamica |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL) |
| Hosting | [Netlify](https://netlify.com) |
| Serverless functions | Netlify Functions (Node.js) |
| AI | Anthropic Claude Sonnet (chat coach + piano allenamento) |
| Attività sportive | Strava API v3 (OAuth 2.0) |

### Architettura

L'app è una **SPA senza build step**: `index.html` carica React e Babel via CDN, poi fa fetch di `nutri_tracker.jsx` e lo compila al volo nel browser. Questo rende il deploy estremamente semplice — basta pubblicare i file statici.

```
/
├── index.html                  # Entry point + boot script
├── nutri_tracker.jsx           # Intera app React (componenti + logica)
├── netlify.toml                # Configurazione Netlify
├── netlify/functions/
│   ├── ai-chat.js              # Proxy Claude API (coach AI)
│   ├── generate-training-plan.js  # Generazione piano settimanale AI
│   ├── strava-token.js         # OAuth Strava (exchange + refresh token)
│   └── strava-activities.js    # Fetch attività e dettagli Strava
└── logo_kronos.png
```

---

## Variabili d'ambiente (Netlify)

Da configurare nel pannello Netlify → Site configuration → Environment variables:

```
ANTHROPIC_API_KEY=        # API key Anthropic (Claude)
STRAVA_CLIENT_ID=         # Client ID app Strava
STRAVA_CLIENT_SECRET=     # Client Secret app Strava
```

Le credenziali Supabase sono pubbliche (publishable key) e si trovano direttamente in `index.html`.

---

## Sviluppo locale

Non è richiesto nessun build step. Per sviluppare localmente:

```bash
# Installa Netlify CLI (una volta sola)
npm install -g netlify-cli

# Avvia dev server con le Netlify Functions
netlify dev
```

L'app sarà disponibile su `http://localhost:8888`.

> Senza Netlify CLI puoi aprire `index.html` direttamente nel browser, ma le Netlify Functions (AI, Strava) non funzioneranno.

---

## Deploy

Il deploy è automatico: ogni push su `main` trigghera un nuovo deploy su Netlify tramite CI/CD integrato.

```bash
git add .
git commit -m "descrizione modifica"
git push origin main
```
