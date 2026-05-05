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
 * @description             Workflow Action: Sync parent Case status based on whether the case
 *                          has any active (Escalated) escalation records.
 *                          Triggered by the Case Escalation lifecycle workflow in the UI context.
 *
 * Script Parameters:
 *   custscript_bex_ce_rec_type           - Escalation record type (default: customrecord_bex_case_escalation)
 *   custscript_bex_ce_parent_case_field  - Parent case field ID (default: custrecord_bex_ce_parent_case)
 *   custscript_bex_ce_status_field       - Escalation status field ID (default: custrecord_bex_ce_status)
 *   custscript_bex_ce_status_escalated   - Internal ID of the "Escalated" status list value (REQUIRED)
 *   custscript_bex_ce_case_status_field  - Case status field ID (default: status)
 *   custscript_bex_ce_case_status_esc    - Case status value when escalated (REQUIRED)
 *   custscript_bex_ce_case_status_ip     - Case status value when in-progress / no active escalations (REQUIRED)
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2025-06-01           BEX Team                            Initial version
 *
 */
define(['N/record', 'N/runtime', 'N/search'], function (record, runtime, search) {

    /**
     * @param {Object} context
     * @param {N/record.Record} context.newRecord
     */
    function onAction(context) {
        try {
            const script = runtime.getCurrentScript();

            const escalationRecordType = script.getParameter({ name: 'custscript_bex_ce_rec_type' })
                || 'customrecord_bex_case_escalation';
            const parentCaseField      = script.getParameter({ name: 'custscript_bex_ce_parent_case_field' })
                || 'custrecord_bex_ce_parent_case';
            const statusField          = script.getParameter({ name: 'custscript_bex_ce_status_field' })
                || 'custrecord_bex_ce_status';
            const escalatedStatusId    = script.getParameter({ name: 'custscript_bex_ce_status_escalated' });
            const caseStatusField      = script.getParameter({ name: 'custscript_bex_ce_case_status_field' })
                || 'status';
            const caseStatusEscalated  = script.getParameter({ name: 'custscript_bex_ce_case_status_esc' });
            const caseStatusInProgress = script.getParameter({ name: 'custscript_bex_ce_case_status_ip' });

            const parentCaseId = context.newRecord.getValue({ fieldId: parentCaseField });

            if (!parentCaseId || !escalatedStatusId || !caseStatusEscalated || !caseStatusInProgress) {
                log.error({
                    title:   'Sync Case Status: missing required values — action skipped',
                    details: { parentCaseId, escalatedStatusId, caseStatusEscalated, caseStatusInProgress }
                });
                return 'SKIPPED';
            }

            // Check if the parent case has at least one active escalation
            let hasActiveEscalation = false;
            search.create({
                type: escalationRecordType,
                filters: [
                    [parentCaseField, 'anyof', parentCaseId],
                    'AND',
                    [statusField,      'anyof', escalatedStatusId]
                ],
                columns: ['internalid']
            }).run().each(() => {
                hasActiveEscalation = true;
                return false; // stop after first match
            });

            record.submitFields({
                type:   record.Type.SUPPORT_CASE,
                id:     parentCaseId,
                values: { [caseStatusField]: hasActiveEscalation ? caseStatusEscalated : caseStatusInProgress },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

            return hasActiveEscalation ? 'ESCALATED' : 'IN_PROGRESS';
        } catch (e) {
            log.error({ title: 'WFA Sync Case Status failed', details: e });
            throw e;
        }
    }

    return { onAction };
});
