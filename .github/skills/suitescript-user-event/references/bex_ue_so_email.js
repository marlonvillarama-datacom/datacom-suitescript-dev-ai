/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             UserEventScript
 * 
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 * 
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 * 
 * @description             User Event script for sending real-time notifications when creating IC POs.
 *                          JIRA Ticket: KAIZ-13131
 *                          Deployments:
 *                          1. One-time manual deployment
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 05/02/2026           Marlon Villarama                    Project setup; initial version
 * 
 */
define(
    [
        'N/email',
        'N/runtime',
        'N/url',

        'BEX/params',
        'BEX/search'
    ],
    (
        email,
        runtime,
        url,

        params,
        search
    ) => {
        const MODULE = `BEX.UE.SOEmail`;
        const PARAMS = {
            icpoSearchId: 'custscript_bex_ue_icpo_email_ss',
            recipients: 'custscript_bex_ue_icpo_email_rec',
            sender: 'custscript_bex_ue_icpo_email_sender'
        };
        // NZ PSG IC Dropship POs pending AU IC SO Pairing

        const buildEmail = ({ data, type }) => {
            const TITLE = `${MODULE}.BuildEmail`;
            let subject = `IC PO ${ type === 'create' ? ' Created' : 'Updated' } - ${data['Document Number']}`;
            let body = '<table border="0" cellpadding="5" cellspacing="5">';

            for (const [key, value] of Object.entries(data)) {
                if (key === 'id') { continue; }

                body += `<tr>
                <td style="min-width: 200px;"><strong>${key}</strong></td>
                <td>${value}</td>
                </tr>`;
            }
            body += `</table>
            <p><a href="${buildRecordLink({ id: data.id })} target="_blank"><strong>View Record</strong></a></p>`;

            return {
                subject,
                body
            };
        };

        const buildRecordLink = ({ id }) => {
            const TITLE = `${MODULE}.BuildRecordLink`;

            let recordUrl = `https://`;
            recordUrl += url.resolveDomain({
                hostType: url.HostType.APPLICATION,
                accountId: runtime.accountId
            });
            recordUrl += url.resolveRecord({
                recordType: 'purchaseorder',
                recordId: id
            });

            log.debug({ title: TITLE, details: recordUrl });
            return recordUrl;
        };

        const getItemSKUs = ({ newRecord }) => {
            const TITLE = `${MODULE}.GetItemSKUs`;
            let items = [];

            const ITEMS = { sublistId: 'item' };
            let count = newRecord.getLineCount(ITEMS);
            for (let line = 0; line < count; line++) {
                const LINE = { ...ITEMS, line };
                items.push(newRecord.getSublistText({ ...LINE, fieldId: 'item' }));
            }

            log.debug({ title: `${TITLE} items`, details: items });
            return items;
        };

        const parseRecipients = ({ data }) => {
            const TITLE = `${MODULE}.ParseRecipients`;
            let output = [];

            let temp = data.split('\n')
                .map(d => d.trim().split(','));
            log.debug({ title: `${TITLE} temp`, details: temp });

            output = temp.reduce((sum, next) => sum = sum.concat(next), [])
                .map(d => d.trim().toLowerCase());
            output = [ ...new Set(output.filter(d => !!d === true)) ];
            log.debug({ title: TITLE, details: output });

            return output;
        };

        const readSearchValues = ({ recordId, searchId }) => {
            const TITLE = `${MODULE}.ReadSearchValues`;
            let searchObject = search.load({
                id: searchId,
                filters: [ 'internalid', 'anyof', recordId ]
            });
            
            let results = searchObject.getJson({ text: true });
            log.debug({ title: `${TITLE} results`, details: results });
            return results;
        };

        const sendEmail = ({ newRecord, type }) => {
            const TITLE = `${MODULE}.SendEmail`;
            let scriptParams = params.read({ map: PARAMS });

            let searchValues = readSearchValues({
                recordId: newRecord.id,
                searchId: scriptParams[PARAMS.icpoSearchId]
            });
            if (searchValues.length <= 0) {
                log.audit({ title: TITLE, details: `Unable to read data for ICPO ${newRecord.getValue({ fieldId: 'tranid' })}. Exiting...` });
                return;
            }

            let emailData = buildEmail({
                data: {
                    id: newRecord.id,
                    ...searchValues[0],
                    Item: getItemSKUs({ newRecord }).join(', ')
                },
                type
            });
            email.send({
                author: scriptParams[PARAMS.sender],
                body: emailData.body,
                recipients: parseRecipients({ data: scriptParams[PARAMS.recipients] }),
                subject: emailData.subject,
                relatedRecords: { transactionId: newRecord.id }
            });
        };

        const validate = ({ type }) => {
            const TITLE = `${MODULE}.Validate`;

            if ([ 'create', 'edit' ].indexOf(type) < 0) {
                log.audit({ title: TITLE, details: `Invalid event type (${type}). Exiting...` });
                return false;
            }

            let scriptParams = params.read({ map: PARAMS });
            if (!scriptParams[PARAMS.icpoSearchId]) {
                log.audit({ title: TITLE, details: `Missing required parameter: ICPO Saved Search. Exiting...` });
                return false;
            }

            if (!scriptParams[PARAMS.sender]) {
                log.audit({ title: TITLE, details: `Missing required parameter: Email sender. Exiting...` });
                return false;
            }

            return true;
        };

        return {
            afterSubmit: ({ newRecord, type }) => {
                const TITLE = `${MODULE}.AfterSubmit`;

                log.audit({ title: TITLE, details: '*** SCRIPT START ***' });
                if (validate({ type }) !== true) {
                    log.audit({ title: TITLE, details: '*** SCRIPT END ***' });
                    return;
                }

                sendEmail({ newRecord, type });
                log.audit({ title: TITLE, details: '*** SCRIPT END ***' });
            }
        };
    }
);