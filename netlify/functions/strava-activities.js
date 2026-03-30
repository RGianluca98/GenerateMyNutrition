// Netlify Function: recupera le attività Strava (lista o dettaglio singola)
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const accessToken = event.headers['authorization']?.replace('Bearer ', '');
  if (!accessToken) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No access token' }) };
  }

  const activityId = event.queryStringParameters?.activity_id;

  try {
    let url;
    if (activityId) {
      // Dettaglio singola attività: laps, splits, HR, elevation
      url = `https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`;
    } else {
      const perPage = event.queryStringParameters?.per_page || 20;
      const after = event.queryStringParameters?.after || '';
      url = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}${after ? `&after=${after}` : ''}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify(data) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
