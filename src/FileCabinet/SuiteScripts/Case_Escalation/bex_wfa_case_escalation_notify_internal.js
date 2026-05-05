/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             WorkflowActionScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Workflow Action: Send an email notification to the internal escalatee
 *                          when a new Internal Case Escalation is created.
 *                          Skips automatically for External escalations.
 *
 * Script Parameters:
 *   custscript_bex_ce_notify_type_field      - Escalation type field ID (default: custrecord_bex_ce_type)
 *   custscript_bex_ce_notify_internal_type   - Internal ID of the "Internal" type list value (REQUIRED)
 *   custscript_bex_ce_notify_escalatee_field - Escalatee field ID (default: custrecord_bex_ce_escalatee)
 *   custscript_bex_ce_notify_msg_field       - Message field ID (default: custrecord_bex_ce_message)
 *   custscript_bex_ce_notify_parent_case_fld - Parent case field ID (default: custrecord_bex_ce_parent_case)
 *   custscript_bex_ce_notify_sender          - Employee internal ID used as email sender (REQUIRED)
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2025-06-01           BEX Team                            Initial version
 *
 */
define(['N/email', 'N/runtime', 'N/search'], function (email, runtime, search) {

    /**
     * @param {Object} context
     * @param {N/record.Record} context.newRecord
     */
    function onAction(context) {
        try {
            const script = runtime.getCurrentScript();

            const typeField         = script.getParameter({ name: 'custscript_bex_ce_notify_type_field' })
                || 'custrecord_bex_ce_type';
            const internalTypeValue = script.getParameter({ name: 'custscript_bex_ce_notify_internal_type' });
            const escalateeField    = script.getParameter({ name: 'custscript_bex_ce_notify_escalatee_field' })
                || 'custrecord_bex_ce_escalatee';
            const messageField      = script.getParameter({ name: 'custscript_bex_ce_notify_msg_field' })
                || 'custrecord_bex_ce_message';
            const parentCaseField   = script.getParameter({ name: 'custscript_bex_ce_notify_parent_case_fld' })
                || 'custrecord_bex_ce_parent_case';
            const senderId          = script.getParameter({ name: 'custscript_bex_ce_notify_sender' });

            const escalationType = context.newRecord.getValue({ fieldId: typeField });

            // Only send notifications for Internal escalations (D5)
            if (!internalTypeValue || String(escalationType) !== String(internalTypeValue)) {
                return 'SKIPPED_NOT_INTERNAL';
            }

            const escalateeId    = context.newRecord.getValue({ fieldId: escalateeField });
            const parentCaseId   = context.newRecord.getValue({ fieldId: parentCaseField });
            const escalationMsg  = context.newRecord.getValue({ fieldId: messageField }) || '';
            const escalationId   = context.newRecord.id;

            if (!senderId || !escalateeId || !parentCaseId) {
                log.error({
                    title:   'Notify Internal: missing required values — action skipped',
                    details: { senderId, escalateeId, parentCaseId }
                });
                return 'SKIPPED_MISSING_VALUES';
            }

            // Fetch case number and title for email content
            const caseLookup  = search.lookupFields({
                type:    search.Type.SUPPORT_CASE,
                id:      parentCaseId,
                columns: ['casenumber', 'title']
            });
            const caseNumber  = caseLookup.casenumber || String(parentCaseId);
            const caseTitle   = caseLookup.title || '';

            const bodyLines = [
                `A case escalation has been raised for Case #${caseNumber}.`,
                caseTitle      ? `Case Title:     ${caseTitle}`    : null,
                escalationId   ? `Escalation ID:  ${escalationId}` : null,
                '',
                `Message:`,
                escalationMsg
            ].filter(line => line !== null);

            email.send({
                author:     Number(senderId),
                recipients: [Number(escalateeId)],
                subject:    `Case Escalation Notification: Case #${caseNumber}`,
                body:       bodyLines.join('\n')
            });

            return 'SENT';
        } catch (e) {
            log.error({ title: 'WFA Notify Internal Escalatee failed', details: e });
            throw e;
        }
    }

    return { onAction };
});
