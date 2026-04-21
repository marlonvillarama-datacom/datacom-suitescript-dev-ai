const SuiteCloudJestConfiguration = require('@oracle/suitecloud-unit-testing/jest-configuration/SuiteCloudJestConfiguration');

const baseConfig = SuiteCloudJestConfiguration.build({
    projectFolder: 'src',
    projectType: SuiteCloudJestConfiguration.ProjectType.ACP,
});

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    setupFiles: [
        ...(baseConfig.setupFiles || []),
        './jest.setup.js',
    ],
    moduleNameMapper: {
        ...(baseConfig.moduleNameMapper || {}),
        // Resolve BEX/* AMD path alias to the shared modules directory
        '^BEX/(.*)$': '<rootDir>/src/FileCabinet/SuiteScripts/Shared_Modules/modules/$1',
    },
    collectCoverageFrom: [
        'src/FileCabinet/SuiteScripts/Business Extension/bex_sl_invoice_email.js',
        'src/FileCabinet/SuiteScripts/Business Extension/bex_sl_invoice_email_be.js',
        'src/FileCabinet/SuiteScripts/Business Extension/bex_cs_invoice_email.js',
    ],
};
