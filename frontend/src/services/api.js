const BASE_URL = '/api';

async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      console.error(`API Error ${response.status}: ${await response.text()}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Network Error: ${error.message}`);
    return null;
  }
}

export const api = {
  fetchDashboardSummary: () => fetchJson('/dashboard/summary'),
  fetchZones: () => fetchJson('/zones'),
  createZone: (data) => fetchJson('/zones', { method: 'POST', body: JSON.stringify(data) }),
  deleteZone: (id) => fetchJson(`/zones/${id}`, { method: 'DELETE' }),
  fetchZoneDetail: (id) => fetchJson(`/zones/${id}`),
  fetchRisk: () => fetchJson('/risk'),
  fetchPredictions: () => fetchJson('/predictions'),
  fetchMacroPredictions: () => fetchJson('/predictions/macro'),
  fetchPriorities: () => fetchJson('/priorities'),
  fetchResources: () => fetchJson('/resources'),
  createResource: (data) => fetchJson('/resources', { method: 'POST', body: JSON.stringify(data) }),
  fetchAssignments: () => fetchJson('/resources/assignments'),
  manualAssignResource: (resourceId, zoneId) => fetchJson(`/resources/${resourceId}/assign`, { method: 'PUT', body: JSON.stringify({ zone_id: zoneId }) }),
  fetchAlerts: (role = 'all', limit = 50) => fetchJson(`/alerts?role=${role}&limit=${limit}`),
  createAlert: (data) => fetchJson('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  deleteAlert: (id) => fetchJson(`/alerts/${id}`, { method: 'DELETE' }),
  fetchShelters: () => fetchJson('/shelters'),
  fetchTeams: () => fetchJson('/teams'),
  updateTeamStatus: (id, status) => fetchJson(`/teams/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateTeamLocation: (id, latitude, longitude) => fetchJson(`/teams/${id}/location`, { method: 'PUT', body: JSON.stringify({ latitude, longitude }) }),
  submitHelpRequest: (data) => fetchJson('/help-requests', { method: 'POST', body: JSON.stringify(data) }),
  markSafe: (data) => fetchJson('/citizens/safe', { method: 'POST', body: JSON.stringify(data) }),
  reportIncident: (data) => fetchJson('/citizens/report', { method: 'POST', body: JSON.stringify(data) }),
  applyScenario: (data) => fetchJson('/scenario/apply', { method: 'POST', body: JSON.stringify(data) }),
  resetScenario: () => fetchJson('/scenario/reset', { method: 'POST' }),
  autoEscalate: (stage) => fetchJson('/scenario/auto-escalate', { method: 'POST', body: JSON.stringify({ stage }) }),
  fetchRoute: (fromLat, fromLng, toLat, toLng) => fetchJson(`/routes?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}`),
  fetchHelpRequests: () => fetchJson('/help-requests'),
  fetchTeamRequests: (resourceId) => fetchJson(`/help-requests/for-team/${resourceId}`),
  dispatchRequest: (id) => fetchJson(`/help-requests/${id}/dispatch`, { method: 'PUT' }),
  resolveRequest: (id) => fetchJson(`/help-requests/${id}/resolve`, { method: 'PUT' }),
  deleteHelpRequest: (id) => fetchJson(`/help-requests/${id}`, { method: 'DELETE' }),
};
