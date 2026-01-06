const config = {
    PATIENT_SERVICE_URL: import.meta.env.VITE_PATIENT_SERVICE_URL || 'http://localhost:8080',
    CLINICAL_SERVICE_URL: import.meta.env.VITE_CLINICAL_SERVICE_URL || 'http://localhost:8081',
    AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8082',
};

export default config;
