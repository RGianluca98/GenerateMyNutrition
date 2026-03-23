// Netlify Function: scambia il code OAuth Strava con access_token + refresh_token
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { code, grant_type, refresh_token } = JSON.parse(event.body || '{}');

  // Restituisce solo il client_id (pubblico) per costruire l'URL OAuth nel frontend
  if (grant_type === 'get_client_id') {
    return { statusCode: 200, headers, body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID }) };
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: grant_type || 'authorization_code',
    ...(grant_type === 'refresh_token' ? { refresh_token } : { code }),
  });

  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify(data) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
