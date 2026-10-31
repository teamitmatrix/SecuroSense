export const environment = {
    production: true,

    // API URL - Update this based on your deployment
    apiUrl: 'https://api.imta.io/api',

    // API Configuration
    apiTimeout: 30000, // 30 seconds
    maxRetries: 3,

    // Feature Flags
    enableAnalytics: true,
    enableErrorTracking: true,
    enableDebugMode: false,

    // App Configuration
    appName: 'SecuroSense',
    appVersion: '1.0.0',

    // File Upload Limits (match backend)
    maxFileSize: 52428800, // 50MB in bytes
    allowedFileTypes: ['.mp3', '.wav', '.pdf', '.doc', '.docx'],

    // Pagination
    defaultPageSize: 10,
    maxPageSize: 100,

    // Cache settings
    cacheTimeout: 300000, // 5 minutes

    // Internationalization
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar', 'fr'],

    // Session
    sessionTimeout: 3600000, // 1 hour in milliseconds
    refreshTokenBeforeExpiry: 300000, // Refresh 5 minutes before expiry
};

