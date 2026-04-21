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
 * @description             Front-end Suitelet for sending overdue invoice emails to customers.
 *                          Displays customers with overdue invoices grouped by customer name,
 *                          showing amount owed and subsidiary. Users can select customers and
 *                          click "Send Invoice Emails" to trigger async email delivery via the
 *                          back-end Suitelet.
 *
 * Script Parameters:
 *   custscript_bex_inv_email_be_script  - Script ID of the back-end Suitelet
 *   custscript_bex_inv_email_be_deploy  - Deployment ID of the back-end Suitelet
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 20/04/2026           Marlon Villarama                    Initial version
 *
 */

define(
    [
        'N/search',
        'N/ui/serverWidget',
        'N/url',
        'N/runtime',
        'BEX/ui',
    ],
    (
        search,
        serverWidget,
        url,
        runtime,
        ui,
    ) => {
        const MODULE = 'BEX.InvoiceEmail.SL';

        const SCRIPT_PARAMS = {
            beScriptId: 'custscript_bex_inv_email_be_script',
            beDeployId: 'custscript_bex_inv_email_be_deploy',
        };

        // Field IDs shared with the client script — must stay in sync with bex_cs_invoice_email.js
        const SUBLIST_ID = 'custpage_bex_sl_customers';
        const FIELD_IDS = {
            BACKEND_URL:   'custpage_bex_fld_backend_url',
            SELECT:        'custpage_bex_slf_select',
            CUSTOMER_ID:   'custpage_bex_slf_customerid',
            CUSTOMER_NAME: 'custpage_bex_slf_customername',
            AMOUNT_OWED:   'custpage_bex_slf_amountowed',
            SUBSIDIARY:    'custpage_bex_slf_subsidiary',
        };

        // ─── Entry Point ────────────────────────────────────────────────────────────

        const onRequest = (context) => {
            handleOnRequest(context);
        };

        // ─── Helper Functions ────────────────────────────────────────────────────────

        const handleOnRequest = (context) => {
            if (context.request.method !== 'GET') { return; }
            renderForm(context);
        };

        const renderForm = (context) => {
            const TITLE = `${MODULE}.RenderForm`;
            try {
                const script = runtime.getCurrentScript();
                const beScriptId = script.getParameter({ name: SCRIPT_PARAMS.beScriptId });
                const beDeployId = script.getParameter({ name: SCRIPT_PARAMS.beDeployId });

                const backendUrl = url.resolveScript({
                    scriptId: beScriptId,
                    deploymentId: beDeployId,
                    returnExternalUrl: false,
                });

                const customerData = getOverdueInvoicesByCustomer();

                const bexForm = ui.createForm({ title: 'Send Invoice Emails' });
                bexForm.addSpinner();

                // Hidden field passes the back-end URL to the client script at runtime
                const urlField = bexForm.form.addField({
                    id: FIELD_IDS.BACKEND_URL,
                    label: 'Backend URL',
                    type: serverWidget.FieldType.TEXT,
                });
                urlField.defaultValue = backendUrl || '';
                urlField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                // BEX/ui.addButton does not support functionName, so use the raw form object directly
                bexForm.form.addButton({
                    id: 'custpage_bex_btn_send_email',
                    label: 'Send Invoice Emails',
                    functionName: 'sendInvoiceEmails',
                });

                bexForm.form.clientScriptModulePath = '/SuiteScripts/Business Extension/bex_cs_invoice_email.js';

                buildCustomerSublist(bexForm.form, customerData);

                context.response.writePage(bexForm.form);
            } catch (e) {
                log.error({ title: `${TITLE} Error`, details: e });
                throw e;
            }
        };

        // ─── Utility Functions ───────────────────────────────────────────────────────

        /**
         * Searches for all open invoices that are strictly past their due date,
         * then aggregates the results by customer, summing amount remaining.
         * @returns {Array<{customerId, customerName, amountOwed, subsidiary}>}
         */
        const getOverdueInvoicesByCustomer = () => {
            const TITLE = `${MODULE}.GetOverdueInvoicesByCustomer`;
            const STEP = 1000;

            const invoiceSearch = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['status', 'anyof', 'CustInvc:A'],  // Open invoices only
                    'AND',
                    ['duedate', 'before', 'today'],      // Strictly past due
                ],
                columns: [
                    search.createColumn({ name: 'entity',          label: 'Customer' }),
                    search.createColumn({ name: 'amountremaining', label: 'Amount Remaining' }),
                    search.createColumn({ name: 'subsidiary',      label: 'Subsidiary' }),
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

            log.debug({ title: `${TITLE} total invoice rows`, details: allResults.length });

            const customerMap = {};
            allResults.forEach(r => {
                const customerId   = r.getValue({ name: 'entity' });
                const customerName = r.getText({ name: 'entity' });
                const amountOwed   = parseFloat(r.getValue({ name: 'amountremaining' }) || 0);
                const subsidiary   = r.getText({ name: 'subsidiary' });

                if (!customerMap[customerId]) {
                    customerMap[customerId] = { customerId, customerName: customerName || '', amountOwed: 0, subsidiary: subsidiary || '' };
                }
                customerMap[customerId].amountOwed += amountOwed;
            });

            return Object.values(customerMap);
        };

        /**
         * Creates the LIST sublist and populates it with one row per customer.
         * Uses the raw form object for precise control over column types and display.
         */
        const buildCustomerSublist = (form, customerData) => {
            const TITLE = `${MODULE}.BuildCustomerSublist`;

            const sublist = form.addSublist({
                id: SUBLIST_ID,
                label: 'Customers with Overdue Invoices',
                type: serverWidget.SublistType.LIST,
            });

            sublist.addField({ id: FIELD_IDS.SELECT, label: ' ', type: serverWidget.FieldType.CHECKBOX });

            const custIdField = sublist.addField({
                id: FIELD_IDS.CUSTOMER_ID,
                label: 'Customer ID',
                type: serverWidget.FieldType.TEXT,
            });
            custIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            sublist.addField({ id: FIELD_IDS.CUSTOMER_NAME, label: 'Customer Name', type: serverWidget.FieldType.TEXT });
            sublist.addField({ id: FIELD_IDS.AMOUNT_OWED,   label: 'Amount Owed',   type: serverWidget.FieldType.CURRENCY });
            sublist.addField({ id: FIELD_IDS.SUBSIDIARY,    label: 'Subsidiary',    type: serverWidget.FieldType.TEXT });

            customerData.forEach((customer, line) => {
                sublist.setSublistValue({ id: FIELD_IDS.SELECT,        line, value: 'F' });
                sublist.setSublistValue({ id: FIELD_IDS.CUSTOMER_ID,   line, value: String(customer.customerId) });
                sublist.setSublistValue({ id: FIELD_IDS.CUSTOMER_NAME, line, value: customer.customerName });
                sublist.setSublistValue({ id: FIELD_IDS.AMOUNT_OWED,   line, value: customer.amountOwed.toFixed(2) });
                sublist.setSublistValue({ id: FIELD_IDS.SUBSIDIARY,    line, value: customer.subsidiary });
            });

            log.debug({ title: `${TITLE} rows populated`, details: customerData.length });
        };

        return {
            onRequest,
        };
    }
);
