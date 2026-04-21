/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             ClientScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Client script for the Invoice Email Suitelet (bex_sl_invoice_email.js).
 *                          Handles row selection validation and fires concurrent async POST
 *                          requests to the back-end Suitelet — one per selected customer.
 *                          Displays a spinner during processing and a summary dialog on completion.
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 20/04/2026           Marlon Villarama                    Initial version
 *
 */

define(
    [
        'N/currentRecord',
        'N/https',
    ],
    (
        currentRecord,
        https,
    ) => {
        const MODULE = 'BEX.InvoiceEmail.CS';

        // Field IDs must stay in sync with bex_sl_invoice_email.js
        const SUBLIST_ID = 'custpage_bex_sl_customers';
        const FIELD_IDS = {
            BACKEND_URL: 'custpage_bex_fld_backend_url',
            SELECT:      'custpage_bex_slf_select',
            CUSTOMER_ID: 'custpage_bex_slf_customerid',
        };

        // ─── Entry Points ────────────────────────────────────────────────────────────

        const pageInit = (context) => {
            log.debug({ title: `${MODULE}.pageInit`, details: 'Invoice Email Suitelet initialized.' });
        };

        // ─── Button Handler ──────────────────────────────────────────────────────────

        /**
         * Triggered by the "Send Invoice Emails" button (functionName: 'sendInvoiceEmails').
         * Collects checked rows, fires one async POST per selected customer to the back-end
         * Suitelet, then displays a results summary dialog.
         */
        const sendInvoiceEmails = () => {
            const TITLE = `${MODULE}.SendInvoiceEmails`;
            try {
                const record = currentRecord.get();
                const lineCount = record.getLineCount({ sublistId: SUBLIST_ID });
                const backendUrl = record.getValue({ fieldId: FIELD_IDS.BACKEND_URL });

                if (!backendUrl) {
                    alert('Configuration error: back-end URL is not configured. Please contact your administrator.');
                    return;
                }

                // Collect internal IDs of selected customers
                const selectedCustomerIds = [];
                for (let i = 0; i < lineCount; i++) {
                    const isSelected = record.getSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId:   FIELD_IDS.SELECT,
                        line:      i,
                    });
                    if (isSelected === 'T' || isSelected === true) {
                        const customerId = record.getSublistValue({
                            sublistId: SUBLIST_ID,
                            fieldId:   FIELD_IDS.CUSTOMER_ID,
                            line:      i,
                        });
                        selectedCustomerIds.push(customerId);
                    }
                }

                if (selectedCustomerIds.length === 0) {
                    alert('Please select at least one customer before sending emails.');
                    return;
                }

                window.bexToggleOverlay(true);

                // Fire one POST per selected customer concurrently; collect all Promises
                const promises = selectedCustomerIds.map(customerId =>
                    https.post.promise({
                        url:     backendUrl,
                        body:    JSON.stringify({ customerId }),
                        headers: { 'Content-Type': 'application/json' },
                    })
                );

                Promise.all(promises)
                    .then(responses => {
                        window.bexToggleOverlay(false);

                        let successCount = 0;
                        const failures = [];

                        responses.forEach((response, idx) => {
                            try {
                                const result = JSON.parse(response.body);
                                if (result.success) {
                                    successCount++;
                                } else {
                                    failures.push(`Customer ${selectedCustomerIds[idx]}: ${result.error}`);
                                }
                            } catch (parseErr) {
                                failures.push(`Customer ${selectedCustomerIds[idx]}: Unexpected response from server.`);
                            }
                        });

                        let message = `Successfully sent emails to ${successCount} customer(s).`;
                        if (failures.length > 0) {
                            message += `\n\nFailed (${failures.length}):\n${failures.join('\n')}`;
                        }
                        alert(message);
                    })
                    .catch(err => {
                        log.error({ title: `${TITLE} Async Error`, details: err });
                        window.bexToggleOverlay(false);
                        alert('An unexpected error occurred while sending emails. Please check the script execution log for details.');
                    });
            } catch (e) {
                log.error({ title: `${TITLE} Error`, details: e });
                alert('An unexpected error occurred. Please check the script execution log for details.');
            }
        };

        return {
            pageInit,
            sendInvoiceEmails,
        };
    }
);
