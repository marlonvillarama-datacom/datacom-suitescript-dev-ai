/**
 * Tests for bex_sl_invoice_email.js (Front-end Suitelet)
 *
 * Tests are exercised through the exported `onRequest` entry point.
 * Internal helpers (getOverdueInvoicesByCustomer, buildCustomerSublist)
 * are verified indirectly via mock call assertions.
 */

// ─── Mocks — must be declared before any require() calls ────────────────────

jest.mock('N/search', () => ({
    create:       jest.fn(),
    createColumn: jest.fn(opts => opts),
    Type:         { INVOICE: 'invoice', CUSTOMER: 'customer' },
}));

jest.mock('N/ui/serverWidget', () => ({
    FieldType:        { TEXT: 'TEXT', CHECKBOX: 'CHECKBOX', CURRENCY: 'CURRENCY', INLINEHTML: 'INLINEHTML' },
    FieldDisplayType: { HIDDEN: 'HIDDEN' },
    SublistType:      { LIST: 'LIST' },
}));

jest.mock('N/url',     () => ({ resolveScript: jest.fn().mockReturnValue('/mock/backend/url') }));
jest.mock('N/runtime', () => ({
    getCurrentScript: jest.fn().mockReturnValue({
        getParameter: jest.fn().mockReturnValue('mock_value'),
    }),
}));
jest.mock('BEX/ui', () => ({ createForm: jest.fn() }));

// ─── Module refs ──────────────────────────────────────────────────────────────

const search = require('N/search');
const ui     = require('BEX/ui');

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Creates a fake invoice search result row. */
const makeInvoiceRow = ({ entityId, entityName, amount, subsidiary }) => ({
    getValue: jest.fn(({ name }) => {
        if (name === 'entity')          return entityId;
        if (name === 'amountremaining') return String(amount);
        return '';
    }),
    getText: jest.fn(({ name }) => {
        if (name === 'entity')     return entityName;
        if (name === 'subsidiary') return subsidiary;
        return '';
    }),
});

/**
 * Wires up search.create().run().getRange() chain.
 * Pagination: first call returns `firstBatch`, all subsequent calls return `rest`.
 */
const mockSearchWith = (firstBatch, rest = []) => {
    let callCount = 0;
    const mockGetRange = jest.fn(() => {
        const result = callCount === 0 ? firstBatch : rest;
        callCount++;
        return result;
    });
    search.create.mockReturnValue({ run: jest.fn(() => ({ getRange: mockGetRange })) });
    return { mockGetRange };
};

/** Builds a full form mock and wires it into the BEX/ui mock. */
const buildFormMocks = () => {
    const mockSetSublistValue = jest.fn();
    const mockSublist = {
        addField:        jest.fn().mockReturnValue({ updateDisplayType: jest.fn() }),
        setSublistValue: mockSetSublistValue,
    };
    const mockForm = {
        addField:               jest.fn().mockReturnValue({ defaultValue: null, updateDisplayType: jest.fn() }),
        addButton:              jest.fn(),
        addSublist:             jest.fn().mockReturnValue(mockSublist),
        clientScriptModulePath: null,
    };
    ui.createForm.mockReturnValue({ form: mockForm, addSpinner: jest.fn() });
    return { mockForm, mockSublist, mockSetSublistValue };
};

const makeContext = (method = 'GET') => ({
    request:  { method },
    response: { writePage: jest.fn() },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('bex_sl_invoice_email — Front-end Suitelet', () => {
    let onRequest;

    beforeAll(() => {
        ({ onRequest } = require('../bex_sl_invoice_email'));
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Request method guard ────────────────────────────────────────────────

    it('ignores non-GET requests and does not call search.create', () => {
        const context = makeContext('POST');
        onRequest(context);
        expect(search.create).not.toHaveBeenCalled();
        expect(context.response.writePage).not.toHaveBeenCalled();
    });

    // ─── Invoice aggregation by customer ────────────────────────────────────

    it('aggregates two invoices for the same customer into one sublist row with summed amount', () => {
        const { mockSetSublistValue } = buildFormMocks();
        mockSearchWith([
            makeInvoiceRow({ entityId: '100', entityName: 'Acme Corp', amount: 500.00, subsidiary: 'US Sub' }),
            makeInvoiceRow({ entityId: '100', entityName: 'Acme Corp', amount: 250.75, subsidiary: 'US Sub' }),
        ]);

        onRequest(makeContext());

        // One customer row → 5 fields set (select, customerId, name, amount, subsidiary)
        expect(mockSetSublistValue).toHaveBeenCalledTimes(5);

        const amountCall = mockSetSublistValue.mock.calls.find(
            ([opts]) => opts.id === 'custpage_bex_slf_amountowed'
        );
        expect(amountCall[0].value).toBe('750.75');
    });

    it('handles a single invoice for a single customer correctly', () => {
        const { mockSetSublistValue } = buildFormMocks();
        mockSearchWith([
            makeInvoiceRow({ entityId: '200', entityName: 'Beta Ltd', amount: 1200.00, subsidiary: 'AU Sub' }),
        ]);

        onRequest(makeContext());

        expect(mockSetSublistValue).toHaveBeenCalledTimes(5);

        const amountCall = mockSetSublistValue.mock.calls.find(
            ([opts]) => opts.id === 'custpage_bex_slf_amountowed'
        );
        expect(amountCall[0].value).toBe('1200.00');
    });

    it('renders without error and does not call setSublistValue when there are no overdue invoices', () => {
        const { mockSetSublistValue } = buildFormMocks();
        mockSearchWith([]);

        onRequest(makeContext());

        expect(search.create).toHaveBeenCalledTimes(1);
        expect(mockSetSublistValue).not.toHaveBeenCalled();
    });

    // ─── Pagination ──────────────────────────────────────────────────────────

    it('calls getRange a second time when the first batch contains exactly 1000 rows', () => {
        buildFormMocks();
        const largeBatch = Array.from({ length: 1000 }, (_, i) =>
            makeInvoiceRow({ entityId: String(i), entityName: `Customer ${i}`, amount: 10, subsidiary: 'Sub' })
        );
        const { mockGetRange } = mockSearchWith(largeBatch, []);

        onRequest(makeContext());

        expect(mockGetRange).toHaveBeenCalledTimes(2);
        expect(mockGetRange).toHaveBeenNthCalledWith(1, { start: 0,    end: 1000 });
        expect(mockGetRange).toHaveBeenNthCalledWith(2, { start: 1000, end: 2000 });
    });

    // ─── Sublist population ──────────────────────────────────────────────────

    it('calls setSublistValue exactly 5 times per customer (2 customers = 10 total calls)', () => {
        const { mockSetSublistValue } = buildFormMocks();
        mockSearchWith([
            makeInvoiceRow({ entityId: '1', entityName: 'Alpha', amount: 100, subsidiary: 'Sub A' }),
            makeInvoiceRow({ entityId: '2', entityName: 'Beta',  amount: 200, subsidiary: 'Sub B' }),
        ]);

        onRequest(makeContext());

        expect(mockSetSublistValue).toHaveBeenCalledTimes(10);
    });

    it('coerces customer ID to a string when setting the sublist value', () => {
        const { mockSetSublistValue } = buildFormMocks();
        mockSearchWith([
            makeInvoiceRow({ entityId: 123, entityName: 'Numeric ID Corp', amount: 50, subsidiary: 'Sub' }),
        ]);

        onRequest(makeContext());

        const idCall = mockSetSublistValue.mock.calls.find(
            ([opts]) => opts.id === 'custpage_bex_slf_customerid'
        );
        expect(idCall[0].value).toBe('123');
        expect(typeof idCall[0].value).toBe('string');
    });
});
