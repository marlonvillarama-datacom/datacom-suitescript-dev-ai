/**
 * Global setup for SuiteScript Jest tests.
 * Provides NetSuite global stubs that are available in the runtime environment
 * but are not imported as AMD dependencies.
 */

global.log = {
    debug:     jest.fn(),
    error:     jest.fn(),
    audit:     jest.fn(),
    emergency: jest.fn(),
};
