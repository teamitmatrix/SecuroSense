export const environment = {
    production: false,

    // API URL - Local development backend
    apiUrl: 'http://localhost:3000/api',

    // API Configuration
    apiTimeout: 30000,
    maxRetries: 1,

    // Feature Flags
    enableAnalytics: false,
    enableErrorTracking: false,
    enableDebugMode: true,

    // App Configuration
    appName: 'SecuroSense (Dev)',
    appVersion: '1.0.0',

    // File Upload Limits (match backend)
    maxFileSize: 52428800,
    allowedFileTypes: ['.mp3', '.wav', '.pdf', '.doc', '.docx'],

    // Pagination
    defaultPageSize: 10,
    maxPageSize: 100,

    // Cache settings
    cacheTimeout: 300000,

    // Internationalization
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar', 'fr'],

    // Session
    sessionTimeout: 3600000,
    refreshTokenBeforeExpiry: 300000,
};
