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
 * @description             Server-side guard for Case Escalation records:
 *                            - Injects the "De-escalate" button for owners in Edit mode.
 *                            - Blocks hard deletes (D3).
 *                            - Enforces escalation owner immutability (D1).
 *                            - Requires De-escalation Reason when status changes to De-escalated.
 *                            - Syncs parent Case status in non-UI execution contexts (D4).
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2025-06-01           BEX Team                            Initial version
 *
 */
define(['N/record', 'N/runtime', 'N/search'], function (record, runtime, search) {

    const FIELD = {
        PARENT_CASE:  'custrecord_bex_ce_parent_case',
        EMPLOYEE:     'custrecord_bex_ce_employee',
        STATUS:       'custrecord_bex_ce_status',
        DEESC_REASON: 'custrecord_bex_ce_deesc_reason',
        END_DATE:     'custrecord_bex_ce_end_date'
    };

    const ESCALATION_RECORD_TYPE = 'customrecord_bex_case_escalation';
    const ESCALATED_TEXT         = 'escalated';    // present in "Escalated"
    const DE_ESCALATED_TEXT      = 'de-escalat';   // present in "De-escalated"

    // ─── Script Parameters ────────────────────────────────────────────────────────

    function getParams() {
        const s = runtime.getCurrentScript();
        return {
            escalatedStatusId:    String(s.getParameter({ name: 'custscript_bex_ue_ce_escalated_status' })  || ''),
            deEscalatedStatusId:  String(s.getParameter({ name: 'custscript_bex_ue_ce_deescalated_status' }) || ''),
            caseStatusEscalated:  s.getParameter({ name: 'custscript_bex_ue_ce_case_status_esc' }),
            caseStatusInProgress: s.getParameter({ name: 'custscript_bex_ue_ce_case_status_ip' }),
            /** Internal ID of the bypass (admin) role. Defaults to the built-in Administrator role (3). */
            bypassRole:           String(s.getParameter({ name: 'custscript_bex_ue_ce_bypass_role' }) || '3')
        };
    }

    // ─── Entry Points ────────────────────────────────────────────────────────────

    /**
     * Injects the "De-escalate" action button when the user is editing an escalation
     * that is currently in "Escalated" status and the viewer is the owner (or admin).
     *
     * @param {Object} context
     */
    function beforeLoad(context) {
        if (context.type !== context.UserEventType.EDIT) return;
        try {
            const rec    = context.newRecord;
            const user   = runtime.getCurrentUser();
            const params = getParams();
            const ownerId    = String(rec.getValue({ fieldId: FIELD.EMPLOYEE }) || '');
            const statusText = String(rec.getText({ fieldId: FIELD.STATUS }) || '').toLowerCase();

            const isOwner      = ownerId === String(user.id);
            const isAdmin      = String(user.role) === params.bypassRole;
            // "Escalated" but NOT "De-escalated"
            const isEscalated  = statusText.includes(ESCALATED_TEXT) && !statusText.includes(DE_ESCALATED_TEXT);

            if ((isOwner || isAdmin) && isEscalated) {
                context.form.addButton({
                    id:           'custpage_btn_deescalate',
                    label:        'De-escalate',
                    functionName: 'onDeEscalateClick'
                });
            }
        } catch (e) {
            log.error({ title: 'beforeLoad failed', details: e });
        }
    }

    /**
     * Enforces business rules before the record is written to the database:
     *   - Blocks DELETE (D3)
     *   - Sets Employee to the current user on CREATE (D1)
     *   - Prevents non-owner, non-admin users from editing (D1)
     *   - Requires De-escalation Reason when status is De-escalated
     *   - Auto-sets End Date on de-escalation
     *
     * @param {Object} context
     */
    function beforeSubmit(context) {
        try {
            const rec    = context.newRecord;
            const user   = runtime.getCurrentUser();
            const params = getParams();
            const types  = context.UserEventType;

            // D3: Block hard deletes entirely
            if (context.type === types.DELETE) {
                throw new Error('Case escalation records cannot be deleted. Use the De-escalate button to close an escalation.');
            }

            // D1: Lock the owner field to the current user at creation time
            if (context.type === types.CREATE) {
                rec.setValue({ fieldId: FIELD.EMPLOYEE, value: user.id });
            }

            // D1: Prevent edits by anyone other than the owner (admin bypasses this)
            if (context.type === types.EDIT) {
                const ownerId = String(rec.getValue({ fieldId: FIELD.EMPLOYEE }) || '');
                const isAdmin = String(user.role) === params.bypassRole;
                if (!isAdmin && ownerId && ownerId !== String(user.id)) {
                    throw new Error('Only the escalation owner can modify this escalation.');
                }
            }

            // Use internal ID comparison for reliability in server-side context
            const currentStatusId    = String(rec.getValue({ fieldId: FIELD.STATUS }) || '');
            const isDeEscalated      = params.deEscalatedStatusId && currentStatusId === params.deEscalatedStatusId;

            if (isDeEscalated) {
                if (!rec.getValue({ fieldId: FIELD.DEESC_REASON })) {
                    throw new Error('De-escalation Reason is required when de-escalating a case.');
                }
                // Auto-fill End Date if not provided
                if (!rec.getValue({ fieldId: FIELD.END_DATE })) {
                    rec.setValue({ fieldId: FIELD.END_DATE, value: new Date() });
                }
            }
        } catch (e) {
            log.error({ title: 'beforeSubmit failed', details: e });
            throw e;
        }
    }

    /**
     * Syncs the parent Case status after the escalation record is committed.
     * Only runs in non-UI execution contexts — the SuiteFlow workflow handles UI context.
     *
     * @param {Object} context
     */
    function afterSubmit(context) {
        if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) return;

        const types = context.UserEventType;
        if (context.type !== types.CREATE && context.type !== types.EDIT && context.type !== types.DELETE) return;

        try {
            const params = getParams();
            if (!params.escalatedStatusId || !params.caseStatusEscalated || !params.caseStatusInProgress) {
                log.error({
                    title:   'afterSubmit: missing required script parameters',
                    details: params
                });
                return;
            }

            // On DELETE, newRecord is empty; use oldRecord to get the parent case
            const rec         = (context.type === types.DELETE) ? context.oldRecord : context.newRecord;
            const parentCaseId = rec.getValue({ fieldId: FIELD.PARENT_CASE });
            if (!parentCaseId) return;

            // Check if the parent case still has any active (Escalated) escalations
            let hasActiveEscalation = false;
            search.create({
                type: ESCALATION_RECORD_TYPE,
                filters: [
                    [FIELD.PARENT_CASE, 'anyof', parentCaseId],
                    'AND',
                    [FIELD.STATUS,       'anyof', params.escalatedStatusId]
                ],
                columns: ['internalid']
            }).run().each(() => {
                hasActiveEscalation = true;
                return false; // stop after first result
            });

            record.submitFields({
                type:   record.Type.SUPPORT_CASE,
                id:     parentCaseId,
                values: { status: hasActiveEscalation ? params.caseStatusEscalated : params.caseStatusInProgress },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });
        } catch (e) {
            log.error({ title: 'afterSubmit: case status sync failed', details: e });
        }
    }

    return { beforeLoad, beforeSubmit, afterSubmit };
});
