import config from './config';

const apiRequest = async (service, endpoint, options = {}) => {
    const baseUrl = config[`${service.toUpperCase()}_SERVICE_URL`];
    const url = `${baseUrl}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_token',
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error (${service}):`, error.message);
        throw error;
    }
};

export const api = {
    // Patient Service
    getMedications: () => apiRequest('patient', '/medications'),
    addMedication: (data) => apiRequest('patient', '/medications', { method: 'POST', body: JSON.stringify(data) }),
    logAdherence: (data) => apiRequest('patient', '/adherence', { method: 'POST', body: JSON.stringify(data) }),

    // AI Service
    analyzeNote: (data) => apiRequest('ai', '/analyze-note', { method: 'POST', body: JSON.stringify(data) }),
    scanPrescription: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('ai', '/scan-prescription', { method: 'POST', body: formData, headers: {} }); // Content-Type is auto-set for FormData
    },
    checkInteractions: (meds) => apiRequest('ai', '/check-interactions', { method: 'POST', body: JSON.stringify({ medications: meds }) }),
    deIdentify: (data) => apiRequest('ai', '/de-identify', { method: 'POST', body: JSON.stringify(data) }),
    generateCoaching: (context) => apiRequest('ai', '/generate-coaching', { method: 'POST', body: JSON.stringify(context) }),

    // Audit Logs
    getAuditLogs: () => apiRequest('ai', '/audit-log'),

    // Health checks
    checkHealth: (service) => apiRequest(service, '/health').catch(() => ({ status: 'error' })),
};
