/**
 * Tests for bex_sl_invoice_email_be.js (Back-end Suitelet)
 *
 * All tests are exercised through the exported `onRequest` entry point.
 * Internal helpers (getCustomerEmail, getCustomerOverdueInvoices, buildEmailBody)
 * are verified indirectly via mock call assertions and response body inspection.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('N/search', () => ({
    create:       jest.fn(),
    createColumn: jest.fn(opts => opts),
    lookupFields: jest.fn(),
    Type:         { INVOICE: 'invoice', CUSTOMER: 'customer' },
}));

jest.mock('N/email', () => ({ send: jest.fn() }));

jest.mock('N/runtime', () => ({
    getCurrentScript: jest.fn().mockReturnValue({
        getParameter: jest.fn().mockReturnValue('5'),
    }),
}));

// ─── Module refs ──────────────────────────────────────────────────────────────

const search = require('N/search');
const email  = require('N/email');

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Creates a fake invoice search result row for the BE search. */
const makeInvoiceRow = ({ tranid, duedate, amountremaining, currencyText }) => ({
    getValue: jest.fn(({ name }) => {
        if (name === 'tranid')          return tranid;
        if (name === 'duedate')         return duedate;
        if (name === 'amountremaining') return String(amountremaining);
        return '';
    }),
    getText: jest.fn(({ name }) => {
        if (name === 'currency') return currencyText;
        return '';
    }),
});

/**
 * Wires up search.create().run().getRange() with pagination support.
 * `firstBatch` is returned on the first call; `rest` on all subsequent calls.
 */
const mockInvoiceSearch = (firstBatch, rest = []) => {
    let callCount = 0;
    const mockGetRange = jest.fn(() => {
        const result = callCount === 0 ? firstBatch : rest;
        callCount++;
        return result;
    });
    search.create.mockReturnValue({ run: jest.fn(() => ({ getRange: mockGetRange })) });
    return { mockGetRange };
};

/** Creates a mock Suitelet context for the back-end. */
const makeContext = (method, bodyObj) => ({
    request: {
        method,
        body: JSON.stringify(bodyObj),
    },
    response: {
        setHeader: jest.fn(),
        write:     jest.fn(),
    },
});

/** Parses the JSON written to the mock response. */
const getWrittenResult = (mockContext) =>
    JSON.parse(mockContext.response.write.mock.calls[0][0]);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('bex_sl_invoice_email_be — Back-end Suitelet', () => {
    let onRequest;

    beforeAll(() => {
        ({ onRequest } = require('../bex_sl_invoice_email_be'));
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Request method guard ────────────────────────────────────────────────

    it('returns success:false for a GET request', () => {
        const context = makeContext('GET', {});
        onRequest(context);
        const result = getWrittenResult(context);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/only post/i);
    });

    // ─── Input validation ────────────────────────────────────────────────────

    it('returns success:false when customerId is missing from the request body', () => {
        const context = makeContext('POST', {});
        search.lookupFields.mockReturnValue({ email: 'test@example.com' });
        onRequest(context);
        const result = getWrittenResult(context);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/customer id is required/i);
    });

    // ─── getCustomerEmail ────────────────────────────────────────────────────

    it('returns success:false when the customer record has no email address', () => {
        search.lookupFields.mockReturnValue({ email: '' });
        mockInvoiceSearch([]);

        const context = makeContext('POST', { customerId: '123' });
        onRequest(context);
        const result = getWrittenResult(context);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/no email address found/i);
    });

    it('calls search.lookupFields with the correct customerId to retrieve the email', () => {
        search.lookupFields.mockReturnValue({ email: '' });

        const context = makeContext('POST', { customerId: '456' });
        onRequest(context);

        expect(search.lookupFields).toHaveBeenCalledWith(
            expect.objectContaining({ id: '456', columns: ['email'] })
        );
    });

    // ─── getCustomerOverdueInvoices ──────────────────────────────────────────

    it('returns success:false when the customer has no overdue invoices', () => {
        search.lookupFields.mockReturnValue({ email: 'cust@example.com' });
        mockInvoiceSearch([]);

        const context = makeContext('POST', { customerId: '789' });
        onRequest(context);
        const result = getWrittenResult(context);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/no overdue invoices found/i);
    });

    it('paginates invoice search when the first batch has exactly 1000 rows', () => {
        search.lookupFields.mockReturnValue({ email: 'big@example.com' });
        const largeBatch = Array.from({ length: 1000 }, (_, i) =>
            makeInvoiceRow({ tranid: `INV-${i}`, duedate: '01/01/2025', amountremaining: 10, currencyText: 'USD' })
        );
        const { mockGetRange } = mockInvoiceSearch(largeBatch, []);

        // Even with 1000 invoices the email should still send — email.send should be called
        const context = makeContext('POST', { customerId: '999' });
        onRequest(context);

        expect(mockGetRange).toHaveBeenCalledTimes(2);
        expect(mockGetRange).toHaveBeenNthCalledWith(1, { start: 0,    end: 1000 });
        expect(mockGetRange).toHaveBeenNthCalledWith(2, { start: 1000, end: 2000 });
        expect(email.send).toHaveBeenCalledTimes(1);
    });

    it('maps raw search rows to the expected invoice shape', () => {
        search.lookupFields.mockReturnValue({ email: 'cust@example.com' });
        mockInvoiceSearch([
            makeInvoiceRow({ tranid: 'INV-001', duedate: '15/03/2025', amountremaining: 999.99, currencyText: 'AUD' }),
        ]);

        const context = makeContext('POST', { customerId: '1' });
        onRequest(context);

        const emailBody = email.send.mock.calls[0][0].body;
        expect(emailBody).toContain('INV-001');
        expect(emailBody).toContain('15/03/2025');
        expect(emailBody).toContain('999.99');
        expect(emailBody).toContain('AUD');
    });

    // ─── Happy path ──────────────────────────────────────────────────────────

    it('calls email.send with correct args and returns success:true on the happy path', () => {
        search.lookupFields.mockReturnValue({ email: 'customer@example.com' });
        mockInvoiceSearch([
            makeInvoiceRow({ tranid: 'INV-100', duedate: '01/02/2025', amountremaining: 500, currencyText: 'USD' }),
        ]);

        const context = makeContext('POST', { customerId: '42' });
        onRequest(context);

        expect(email.send).toHaveBeenCalledTimes(1);
        expect(email.send).toHaveBeenCalledWith(
            expect.objectContaining({
                author:     5,
                recipients: ['customer@example.com'],
                subject:    'Overdue Invoice Notice',
            })
        );

        const result = getWrittenResult(context);
        expect(result.success).toBe(true);
        expect(result.customerId).toBe('42');
    });

    // ─── buildEmailBody ──────────────────────────────────────────────────────

    it('generates one <tr> per invoice in the email body HTML', () => {
        search.lookupFields.mockReturnValue({ email: 'cust@example.com' });
        mockInvoiceSearch([
            makeInvoiceRow({ tranid: 'INV-A', duedate: '01/01/2025', amountremaining: 100, currencyText: 'USD' }),
            makeInvoiceRow({ tranid: 'INV-B', duedate: '02/01/2025', amountremaining: 200, currencyText: 'USD' }),
            makeInvoiceRow({ tranid: 'INV-C', duedate: '03/01/2025', amountremaining: 300, currencyText: 'USD' }),
        ]);

        const context = makeContext('POST', { customerId: '7' });
        onRequest(context);

        const emailBody = email.send.mock.calls[0][0].body;
        const trMatches = emailBody.match(/<tr[\s>]/g);
        // 1 header <tr style="..."> + 3 data <tr> rows
        expect(trMatches).toHaveLength(4);
    });

    it('formats the amount to 2 decimal places in the email body', () => {
        search.lookupFields.mockReturnValue({ email: 'cust@example.com' });
        mockInvoiceSearch([
            makeInvoiceRow({ tranid: 'INV-X', duedate: '01/01/2025', amountremaining: 1234.5, currencyText: 'USD' }),
        ]);

        const context = makeContext('POST', { customerId: '8' });
        onRequest(context);

        const emailBody = email.send.mock.calls[0][0].body;
        expect(emailBody).toContain('1234.50');
    });
});
