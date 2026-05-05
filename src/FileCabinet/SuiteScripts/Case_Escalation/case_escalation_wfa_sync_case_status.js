/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'], (record, runtime, search) => {
    function onAction(context) {
        try {
            const script = runtime.getCurrentScript();
            const escalationRecord = context.newRecord;

            const escalationRecordType =
                script.getParameter({ name: 'custscript_bex_ce_rec_type' }) || 'customrecord_bex_case_escalation';
            const parentCaseFieldId =
                script.getParameter({ name: 'custscript_bex_ce_parent_case_field' }) || 'custrecord_bex_ce_parent_case';
            const escalationStatusFieldId =
                script.getParameter({ name: 'custscript_bex_ce_status_field' }) || 'custrecord_bex_ce_status';
            const escalatedStatusValue = script.getParameter({ name: 'custscript_bex_ce_status_escalated' });
            const caseStatusFieldId =
                script.getParameter({ name: 'custscript_bex_ce_case_status_field' }) || 'status';
            const caseStatusEscalated = script.getParameter({ name: 'custscript_bex_ce_case_status_escalated' });
            const caseStatusInProgress = script.getParameter({ name: 'custscript_bex_ce_case_status_inprog' });

            const parentCaseId = escalationRecord.getValue({ fieldId: parentCaseFieldId });
            if (!parentCaseId || !escalatedStatusValue || !caseStatusEscalated || !caseStatusInProgress) {
                log.error({
                    title: 'Sync Case Status skipped due to missing required values',
                    details: {
                        parentCaseId,
                        escalatedStatusValue,
                        caseStatusEscalated,
                        caseStatusInProgress
                    }
                });
                return 'SKIPPED';
            }

            let activeEscalationExists = false;
            search.create({
                type: escalationRecordType,
                filters: [
                    [parentCaseFieldId, 'anyof', parentCaseId],
                    'AND',
                    [escalationStatusFieldId, 'anyof', escalatedStatusValue]
                ],
                columns: ['internalid']
            })
                .run()
                .each(() => {
                    activeEscalationExists = true;
                    return false;
                });

            const targetCaseStatus = activeEscalationExists ? caseStatusEscalated : caseStatusInProgress;

            record.submitFields({
                type: record.Type.SUPPORT_CASE,
                id: parentCaseId,
                values: {
                    [caseStatusFieldId]: targetCaseStatus
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            return 'UPDATED';
        } catch (e) {
            log.error({ title: 'Workflow action failed: sync case status', details: e });
            throw e;
        }
    }

    return {
        onAction
    };
});
