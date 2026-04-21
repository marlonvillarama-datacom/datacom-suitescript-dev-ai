/**
 * @jest-environment jsdom
 *
 * Tests for bex_cs_invoice_email.js (Client Script)
 *
 * Uses jsdom so that `window`, `alert`, and DOM globals are available.
 * `Promise.all` async flow is flushed with `flushPromises()` after each action.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('N/currentRecord', () => ({ get: jest.fn() }));
jest.mock('N/https', () => ({
    // N/https.post is a function with a `.promise` property (NS client-side pattern)
    post: Object.assign(jest.fn(), { promise: jest.fn() }),
}));

// ─── Module refs ──────────────────────────────────────────────────────────────

const currentRecord = require('N/currentRecord');
const https         = require('N/https');

// ─── Test helpers ─────────────────────────────────────────────────────────────

const SUBLIST_ID = 'custpage_bex_sl_customers';
const FIELD_IDS  = {
    BACKEND_URL: 'custpage_bex_fld_backend_url',
    SELECT:      'custpage_bex_slf_select',
    CUSTOMER_ID: 'custpage_bex_slf_customerid',
};

/**
 * Flushes all pending microtasks and macrotasks (Promise callbacks) so that
 * Promise.all().then() branches execute synchronously in tests.
 */
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Builds a mock currentRecord object with configurable sublist rows.
 * @param {string} backendUrl - value of the BACKEND_URL field
 * @param {Array<{selected: boolean, customerId: string}>} rows
 */
const mockRecord = (backendUrl, rows = []) => {
    const record = {
        getValue: jest.fn(({ fieldId }) => {
            if (fieldId === FIELD_IDS.BACKEND_URL) return backendUrl;
            return '';
        }),
        getLineCount: jest.fn(() => rows.length),
        getSublistValue: jest.fn(({ fieldId, line }) => {
            if (fieldId === FIELD_IDS.SELECT)      return rows[line].selected ? 'T' : 'F';
            if (fieldId === FIELD_IDS.CUSTOMER_ID) return rows[line].customerId;
            return '';
        }),
    };
    currentRecord.get.mockReturnValue(record);
    return record;
};

/** Returns a resolved Promise with a JSON body indicating success. */
const resolvedSuccess = (customerId = '1') =>
    Promise.resolve({ body: JSON.stringify({ success: true, customerId }) });

/** Returns a resolved Promise with a JSON body indicating failure. */
const resolvedFailure = (customerId = '1', error = 'Email not found') =>
    Promise.resolve({ body: JSON.stringify({ success: false, customerId, error }) });

/** Returns a resolved Promise with an unparseable body. */
const resolvedBadJson = () =>
    Promise.resolve({ body: 'not-json' });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('bex_cs_invoice_email — Client Script', () => {
    let sendInvoiceEmails;

    beforeAll(() => {
        ({ sendInvoiceEmails } = require('../bex_cs_invoice_email'));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Stub browser globals provided by the spinner HTML
        window.bexToggleOverlay = jest.fn();
        window.alert = jest.fn();
    });

    // ─── Validation guards ───────────────────────────────────────────────────

    it('alerts and does not call https.post.promise when no rows are checked', () => {
        mockRecord('/mock/url', [
            { selected: false, customerId: '1' },
            { selected: false, customerId: '2' },
        ]);

        sendInvoiceEmails();

        expect(https.post.promise).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith(
            expect.stringMatching(/select at least one customer/i)
        );
    });

    it('alerts and does not call https.post.promise when the backend URL is empty', () => {
        mockRecord('', [{ selected: true, customerId: '1' }]);

        sendInvoiceEmails();

        expect(https.post.promise).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith(
            expect.stringMatching(/configuration error/i)
        );
    });

    // ─── Async POST dispatch ─────────────────────────────────────────────────

    it('calls https.post.promise once per selected customer', async () => {
        mockRecord('/api/be', [
            { selected: true,  customerId: '10' },
            { selected: false, customerId: '20' },
            { selected: true,  customerId: '30' },
        ]);
        https.post.promise.mockResolvedValue({ body: JSON.stringify({ success: true }) });

        sendInvoiceEmails();
        await flushPromises();

        expect(https.post.promise).toHaveBeenCalledTimes(2);
    });

    it('passes the correct customerId and backendUrl to each POST request', async () => {
        mockRecord('/api/be', [
            { selected: true, customerId: '42' },
        ]);
        https.post.promise.mockReturnValue(resolvedSuccess('42'));

        sendInvoiceEmails();
        await flushPromises();

        expect(https.post.promise).toHaveBeenCalledWith(
            expect.objectContaining({
                url:  '/api/be',
                body: JSON.stringify({ customerId: '42' }),
            })
        );
    });

    // ─── Spinner behaviour ───────────────────────────────────────────────────

    it('shows the spinner before posting and hides it after all Promises resolve', async () => {
        mockRecord('/api/be', [{ selected: true, customerId: '1' }]);
        https.post.promise.mockReturnValue(resolvedSuccess('1'));

        sendInvoiceEmails();

        expect(window.bexToggleOverlay).toHaveBeenCalledWith(true);
        expect(window.bexToggleOverlay).toHaveBeenCalledTimes(1);

        await flushPromises();

        expect(window.bexToggleOverlay).toHaveBeenCalledWith(false);
        expect(window.bexToggleOverlay).toHaveBeenCalledTimes(2);
    });

    // ─── Summary dialog ──────────────────────────────────────────────────────

    it('shows correct success count in the alert when all emails are sent', async () => {
        mockRecord('/api/be', [
            { selected: true, customerId: '1' },
            { selected: true, customerId: '2' },
        ]);
        https.post.promise
            .mockReturnValueOnce(resolvedSuccess('1'))
            .mockReturnValueOnce(resolvedSuccess('2'));

        sendInvoiceEmails();
        await flushPromises();

        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('Successfully sent emails to 2 customer(s).')
        );
    });

    it('includes failure details in the alert when some emails fail', async () => {
        mockRecord('/api/be', [
            { selected: true, customerId: '1' },
            { selected: true, customerId: '2' },
        ]);
        https.post.promise
            .mockReturnValueOnce(resolvedSuccess('1'))
            .mockReturnValueOnce(resolvedFailure('2', 'No email address found for customer ID 2.'));

        sendInvoiceEmails();
        await flushPromises();

        const alertArg = window.alert.mock.calls[0][0];
        expect(alertArg).toContain('Successfully sent emails to 1 customer(s).');
        expect(alertArg).toContain('Failed (1)');
        expect(alertArg).toContain('Customer 2');
        expect(alertArg).toContain('No email address found for customer ID 2.');
    });

    it('handles a JSON parse error in one response and reports it as a failure', async () => {
        mockRecord('/api/be', [
            { selected: true, customerId: '5' },
        ]);
        https.post.promise.mockReturnValue(resolvedBadJson());

        sendInvoiceEmails();
        await flushPromises();

        const alertArg = window.alert.mock.calls[0][0];
        expect(alertArg).toContain('Successfully sent emails to 0 customer(s).');
        expect(alertArg).toContain('Unexpected response from server.');
    });
});
