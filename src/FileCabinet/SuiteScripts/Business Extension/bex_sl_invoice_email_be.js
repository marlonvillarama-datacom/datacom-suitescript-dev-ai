/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             Suitelet
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Back-end Suitelet for sending overdue invoice emails.
 *                          Accepts POST requests containing a customerId, retrieves all strictly
 *                          overdue open invoices for that customer, and sends an HTML email to
 *                          the customer's email address. Returns a JSON response indicating
 *                          success or failure.
 *
 * Script Parameters:
 *   custscript_bex_inv_email_be_sender  - Internal ID of the NetSuite employee to use as email sender
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 20/04/2026           Marlon Villarama                    Initial version
 *
 */

define(
    [
        'N/search',
        'N/email',
        'N/runtime',
    ],
    (
        search,
        email,
        runtime,
    ) => {
        const MODULE = 'BEX.InvoiceEmail.BE';

        const SCRIPT_PARAMS = {
            senderEmployeeId: 'custscript_bex_inv_email_be_sender',
        };

        // ─── Entry Point ────────────────────────────────────────────────────────────

        const onRequest = (context) => {
            handleOnRequest(context);
        };

        // ─── Helper Functions ────────────────────────────────────────────────────────

        const handleOnRequest = (context) => {
            const TITLE = `${MODULE}.HandleOnRequest`;
            const response = context.response;
            response.setHeader({ name: 'Content-Type', value: 'application/json' });

            if (context.request.method !== 'POST') {
                response.write(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
                return;
            }

            const result = { success: false, customerId: null, error: '' };

            try {
                const body = JSON.parse(context.request.body);
                const customerId = body.customerId;
                result.customerId = customerId;

                if (!customerId) {
                    throw new Error('Customer ID is required.');
                }

                const senderEmployeeId = runtime.getCurrentScript().getParameter({ name: SCRIPT_PARAMS.senderEmployeeId });

                const customerEmail = getCustomerEmail(customerId);
                if (!customerEmail) {
                    throw new Error(`No email address found for customer ID ${customerId}.`);
                }

                const invoices = getCustomerOverdueInvoices(customerId);
                if (!invoices.length) {
                    throw new Error(`No overdue invoices found for customer ID ${customerId}.`);
                }

                email.send({
                    author:     parseInt(senderEmployeeId, 10),
                    recipients: [customerEmail],
                    subject:    'Overdue Invoice Notice',
                    body:       buildEmailBody(invoices),
                });

                result.success = true;
                log.audit({ title: `${TITLE} Email sent`, details: `Customer ID: ${customerId}, Email: ${customerEmail}` });
            } catch (e) {
                log.error({ title: `${TITLE} Error`, details: e });
                result.error = e.message || String(e);
            }

            response.write(JSON.stringify(result));
        };

        // ─── Utility Functions ───────────────────────────────────────────────────────

        /**
         * Retrieves the primary email address of a customer record.
         * @param {string|number} customerId
         * @returns {string} Email address, or empty string if not found.
         */
        const getCustomerEmail = (customerId) => {
            const TITLE = `${MODULE}.GetCustomerEmail`;
            const lookupResult = search.lookupFields({
                type:    search.Type.CUSTOMER,
                id:      customerId,
                columns: ['email'],
            });
            log.debug({ title: `${TITLE} lookupResult`, details: lookupResult });
            return lookupResult.email || '';
        };

        /**
         * Searches for all open invoices for the given customer that are strictly past due.
         * @param {string|number} customerId
         * @returns {Array<{invoiceNumber, dueDate, amountRemaining, currency}>}
         */
        const getCustomerOverdueInvoices = (customerId) => {
            const TITLE = `${MODULE}.GetCustomerOverdueInvoices`;
            const STEP = 1000;

            const invoiceSearch = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['entity', 'anyof', customerId],
                    'AND',
                    ['status', 'anyof', 'CustInvc:A'],  // Open invoices only
                    'AND',
                    ['duedate', 'before', 'today'],      // Strictly past due
                ],
                columns: [
                    search.createColumn({ name: 'tranid',          label: 'Invoice Number' }),
                    search.createColumn({ name: 'duedate',         label: 'Due Date' }),
                    search.createColumn({ name: 'amountremaining', label: 'Amount Remaining' }),
                    search.createColumn({ name: 'currency',        label: 'Currency' }),
                ],
            });

            let start = 0;
            let allResults = [];
            let batch;
            do {
                batch = invoiceSearch.run().getRange({ start, end: start + STEP });
                allResults = allResults.concat(batch);
                start += STEP;
            } while (batch.length >= STEP);

            log.debug({ title: `${TITLE} invoice count`, details: allResults.length });

            return allResults.map(r => ({
                invoiceNumber:   r.getValue({ name: 'tranid' }),
                dueDate:         r.getValue({ name: 'duedate' }),
                amountRemaining: parseFloat(r.getValue({ name: 'amountremaining' }) || 0),
                currency:        r.getText({ name: 'currency' }) || '',
            }));
        };

        /**
         * Builds an HTML email body listing overdue invoices in a formatted table.
         * @param {Array} invoices
         * @returns {string} HTML string
         */
        const buildEmailBody = (invoices) => {
            const rows = invoices.map(inv => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${inv.invoiceNumber}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${inv.dueDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${inv.currency} ${inv.amountRemaining.toFixed(2)}</td>
                </tr>
            `).join('');

            return `
                <p>Dear Customer,</p>
                <p>Please be advised that the following invoices are currently overdue. Kindly arrange payment at your earliest convenience.</p>
                <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Invoice #</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Due Date</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Amount Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p>If you have already arranged payment, please disregard this notice.</p>
                <p>Thank you for your prompt attention to this matter.</p>
            `;
        };

        return {
            onRequest,
        };
    }
);
