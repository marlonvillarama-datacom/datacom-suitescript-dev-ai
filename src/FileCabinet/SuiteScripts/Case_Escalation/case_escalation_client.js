/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'], (runtime) => {
    const FIELD = {
        PARENT_CASE: 'custrecord_bex_ce_parent_case',
        TYPE: 'custrecord_bex_ce_type',
        EMPLOYEE: 'custrecord_bex_ce_employee',
        ESCALATEE: 'custrecord_bex_ce_escalatee',
        LEGACY_INTERNAL_ESCALATEE: 'custrecord_bex_ce_internal_escalatee',
        LEGACY_EXTERNAL_ESCALATEE: 'custrecord_bex_ce_external_escalatee',
        STATUS: 'custrecord_bex_ce_status',
        MESSAGE: 'custrecord_bex_ce_message',
        DEESC_REASON: 'custrecord_bex_ce_deesc_reason',
        START_DATE: 'custrecord_bex_ce_start_date',
        END_DATE: 'custrecord_bex_ce_end_date'
    };

    const DE_ESCALATED_TEXT = 'de-escalated';

    function pageInit(context) {
        try {
            const rec = context.currentRecord;
            const currentUserId = runtime.getCurrentUser().id;
            if (!rec.getValue({ fieldId: FIELD.EMPLOYEE })) {
                rec.setValue({
                    fieldId: FIELD.EMPLOYEE,
                    value: currentUserId,
                    ignoreFieldChange: true
                });
            }
            if (!rec.getValue({ fieldId: FIELD.START_DATE })) {
                rec.setValue({
                    fieldId: FIELD.START_DATE,
                    value: new Date(),
                    ignoreFieldChange: true
                });
            }
            syncConditionalMandatory(rec);
        } catch (e) {
            log.error({ title: 'pageInit failed', details: e });
        }
    }

    function fieldChanged(context) {
        try {
            if (context.fieldId === FIELD.STATUS) {
                syncConditionalMandatory(context.currentRecord);
            }
        } catch (e) {
            log.error({ title: 'fieldChanged failed', details: e });
        }
    }

    function saveRecord(context) {
        try {
            const rec = context.currentRecord;
            const currentUserId = String(runtime.getCurrentUser().id || '');
            const employeeId = String(rec.getValue({ fieldId: FIELD.EMPLOYEE }) || '');

            if (rec.id && employeeId && employeeId !== currentUserId) {
                alert('Only the escalation owner can update this escalation.');
                return false;
            }

            const requiredErrors = [];
            requireField(rec, FIELD.PARENT_CASE, 'Parent Case', requiredErrors);
            requireField(rec, FIELD.TYPE, 'Escalation Type', requiredErrors);
            requireField(rec, FIELD.EMPLOYEE, 'Employee', requiredErrors);
            requireField(rec, FIELD.MESSAGE, 'Escalation Message', requiredErrors);
            requireField(rec, FIELD.START_DATE, 'Escalation Start Date', requiredErrors);

            const unifiedEscalatee = rec.getValue({ fieldId: FIELD.ESCALATEE });
            const legacyEscalatee =
                rec.getValue({ fieldId: FIELD.LEGACY_INTERNAL_ESCALATEE }) ||
                rec.getValue({ fieldId: FIELD.LEGACY_EXTERNAL_ESCALATEE });
            if (!unifiedEscalatee && !legacyEscalatee) {
                requiredErrors.push('Escalatee is required.');
            }

            const statusText = String(rec.getText({ fieldId: FIELD.STATUS }) || '').toLowerCase();
            const isDeEscalated = statusText.indexOf(DE_ESCALATED_TEXT) >= 0;
            if (isDeEscalated) {
                requireField(rec, FIELD.DEESC_REASON, 'De-escalation Reason', requiredErrors);
                if (!rec.getValue({ fieldId: FIELD.END_DATE })) {
                    rec.setValue({
                        fieldId: FIELD.END_DATE,
                        value: new Date(),
                        ignoreFieldChange: true
                    });
                }
            }

            if (requiredErrors.length) {
                alert(requiredErrors.join('\n'));
                return false;
            }
            return true;
        } catch (e) {
            log.error({ title: 'saveRecord failed', details: e });
            alert('Unable to save escalation due to an unexpected error.');
            return false;
        }
    }

    function requireField(rec, fieldId, label, errors) {
        const value = rec.getValue({ fieldId });
        if (value === null || value === '' || value === undefined) {
            errors.push(`${label} is required.`);
        }
    }

    function syncConditionalMandatory(rec) {
        const statusText = String(rec.getText({ fieldId: FIELD.STATUS }) || '').toLowerCase();
        const isDeEscalated = statusText.indexOf(DE_ESCALATED_TEXT) >= 0;
        const reasonField = rec.getField({ fieldId: FIELD.DEESC_REASON });
        if (reasonField) {
            reasonField.isMandatory = isDeEscalated;
        }
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
