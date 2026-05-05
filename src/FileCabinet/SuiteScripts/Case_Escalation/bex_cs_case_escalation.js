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
 * @description             Client-side validation, default-field population, and de-escalation
 *                          button logic for the Case Escalation custom record.
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2025-06-01           BEX Team                            Initial version
 *
 */
define(['N/runtime', 'N/currentRecord'], function (runtime, currentRecord) {

    const FIELD = {
        PARENT_CASE:  'custrecord_bex_ce_parent_case',
        TYPE:         'custrecord_bex_ce_type',
        EMPLOYEE:     'custrecord_bex_ce_employee',
        ESCALATEE:    'custrecord_bex_ce_escalatee',
        STATUS:       'custrecord_bex_ce_status',
        MESSAGE:      'custrecord_bex_ce_message',
        DEESC_REASON: 'custrecord_bex_ce_deesc_reason',
        START_DATE:   'custrecord_bex_ce_start_date',
        END_DATE:     'custrecord_bex_ce_end_date'
    };

    /** Substring match used to detect both "De-escalated" and "De-escalate" label variants */
    const DE_ESCALATED_TEXT = 'de-escalat';

    // ─── Entry Points ────────────────────────────────────────────────────────────

    /**
     * @param {Object} context
     * @param {N/currentRecord.CurrentRecord} context.currentRecord
     */
    function pageInit(context) {
        try {
            const rec   = context.currentRecord;
            const script = runtime.getCurrentScript();
            const deEscalatedStatusId = script.getParameter({ name: 'custscript_bex_cs_ce_deescalated_status' });

            // Populate defaults only when creating a new record
            if (!rec.getValue({ fieldId: FIELD.EMPLOYEE })) {
                rec.setValue({ fieldId: FIELD.EMPLOYEE, value: runtime.getCurrentUser().id, ignoreFieldChange: true });
            }
            if (!rec.getValue({ fieldId: FIELD.START_DATE })) {
                rec.setValue({ fieldId: FIELD.START_DATE, value: new Date(), ignoreFieldChange: true });
            }

            // Reflect de-escalation mandatory state on load
            syncConditionalMandatory(rec);

            /**
             * Handler for the "De-escalate" button injected by the UE beforeLoad.
             * Prompts for a reason, sets all de-escalation fields, then saves.
             */
            window.onDeEscalateClick = function () {
                const reason = window.prompt('Enter reason for de-escalation:');
                if (reason === null) return;          // User cancelled the prompt
                if (!reason.trim()) {
                    alert('De-escalation reason is required.');
                    return;
                }
                try {
                    const liveRec = currentRecord.get();
                    liveRec.setValue({ fieldId: FIELD.DEESC_REASON, value: reason.trim(),  ignoreFieldChange: true });
                    liveRec.setValue({ fieldId: FIELD.END_DATE,      value: new Date(),      ignoreFieldChange: true });
                    if (deEscalatedStatusId) {
                        // Setting STATUS fires fieldChanged → syncConditionalMandatory, enabling the reason field
                        liveRec.setValue({ fieldId: FIELD.STATUS, value: deEscalatedStatusId, ignoreFieldChange: false });
                    }
                    liveRec.save();
                } catch (err) {
                    log.error({ title: 'onDeEscalateClick: save failed', details: err });
                    alert('De-escalation failed. Please try again or contact your administrator.');
                }
            };
        } catch (e) {
            log.error({ title: 'pageInit failed', details: e });
        }
    }

    /**
     * @param {Object} context
     * @param {string} context.fieldId
     * @param {N/currentRecord.CurrentRecord} context.currentRecord
     */
    function fieldChanged(context) {
        try {
            if (context.fieldId === FIELD.STATUS) {
                syncConditionalMandatory(context.currentRecord);
            }
        } catch (e) {
            log.error({ title: 'fieldChanged failed', details: e });
        }
    }

    /**
     * @param {Object} context
     * @param {N/currentRecord.CurrentRecord} context.currentRecord
     * @returns {boolean}
     */
    function saveRecord(context) {
        try {
            const rec           = context.currentRecord;
            const currentUserId = String(runtime.getCurrentUser().id || '');
            const employeeId    = String(rec.getValue({ fieldId: FIELD.EMPLOYEE }) || '');

            // Block updates from anyone other than the escalation owner
            if (rec.id && employeeId && employeeId !== currentUserId) {
                alert('Only the escalation owner can update this escalation.');
                return false;
            }

            const errors = [];
            requireField(rec, FIELD.PARENT_CASE,  'Parent Case',           errors);
            requireField(rec, FIELD.TYPE,          'Escalation Type',       errors);
            requireField(rec, FIELD.EMPLOYEE,      'Employee',              errors);
            requireField(rec, FIELD.ESCALATEE,     'Escalatee',             errors);
            requireField(rec, FIELD.MESSAGE,       'Escalation Message',    errors);
            requireField(rec, FIELD.START_DATE,    'Escalation Start Date', errors);

            const statusText  = String(rec.getText({ fieldId: FIELD.STATUS }) || '').toLowerCase();
            const isDeEscalated = statusText.includes(DE_ESCALATED_TEXT);
            if (isDeEscalated) {
                requireField(rec, FIELD.DEESC_REASON, 'De-escalation Reason', errors);
                // Auto-fill end date if not already set
                if (!rec.getValue({ fieldId: FIELD.END_DATE })) {
                    rec.setValue({ fieldId: FIELD.END_DATE, value: new Date(), ignoreFieldChange: true });
                }
            }

            if (errors.length) {
                alert(errors.join('\n'));
                return false;
            }
            return true;
        } catch (e) {
            log.error({ title: 'saveRecord failed', details: e });
            alert('Unable to save escalation due to an unexpected error.');
            return false;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    function requireField(rec, fieldId, label, errors) {
        const value = rec.getValue({ fieldId });
        if (value === null || value === '' || value === undefined) {
            errors.push(`${label} is required.`);
        }
    }

    /** Makes De-escalation Reason mandatory when status contains "de-escalat*" */
    function syncConditionalMandatory(rec) {
        const statusText    = String(rec.getText({ fieldId: FIELD.STATUS }) || '').toLowerCase();
        const isDeEscalated = statusText.includes(DE_ESCALATED_TEXT);
        const reasonField   = rec.getField({ fieldId: FIELD.DEESC_REASON });
        if (reasonField) {
            reasonField.isMandatory = isDeEscalated;
        }
    }

    return { pageInit, fieldChanged, saveRecord };
});
