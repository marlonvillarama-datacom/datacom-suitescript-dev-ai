/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/runtime', 'N/search'], (email, runtime, search) => {
    function onAction(context) {
        try {
            const script = runtime.getCurrentScript();
            const escalationRecord = context.newRecord;

            const typeFieldId =
                script.getParameter({ name: 'custscript_bex_ce_notify_type_field' }) || 'custrecord_bex_ce_type';
            const internalTypeValue = script.getParameter({ name: 'custscript_bex_ce_notify_internal_type' });
            const escalateeFieldId =
                script.getParameter({ name: 'custscript_bex_ce_notify_internal_emp_field' }) || 'custrecord_bex_ce_escalatee';
            const messageFieldId =
                script.getParameter({ name: 'custscript_bex_ce_notify_msg_field' }) || 'custrecord_bex_ce_message';
            const parentCaseFieldId =
                script.getParameter({ name: 'custscript_bex_ce_notify_parent_case_field' }) || 'custrecord_bex_ce_parent_case';
            const senderId = script.getParameter({ name: 'custscript_bex_ce_notify_sender' });

            const escalationType = escalationRecord.getValue({ fieldId: typeFieldId });
            if (!internalTypeValue || String(escalationType) !== String(internalTypeValue)) {
                return 'SKIPPED';
            }

            const escalateeId = escalationRecord.getValue({ fieldId: escalateeFieldId });
            const parentCaseId = escalationRecord.getValue({ fieldId: parentCaseFieldId });
            const escalationMessage = escalationRecord.getValue({ fieldId: messageFieldId }) || '';
            const escalationId = escalationRecord.id;

            if (!senderId || !escalateeId || !parentCaseId) {
                log.error({
                    title: 'Notify internal skipped due to missing values',
                    details: { senderId, escalateeId, parentCaseId }
                });
                return 'SKIPPED';
            }

            const caseLookup = search.lookupFields({
                type: search.Type.SUPPORT_CASE,
                id: parentCaseId,
                columns: ['casenumber', 'title']
            });
            const caseNumber = caseLookup.casenumber || parentCaseId;
            const caseTitle = caseLookup.title || '';

            email.send({
                author: Number(senderId),
                recipients: [Number(escalateeId)],
                subject: `Case Escalation: Case #${caseNumber}`,
                body: [
                    `A case escalation has been created for Case #${caseNumber}.`,
                    caseTitle ? `Case Title: ${caseTitle}` : '',
                    escalationId ? `Escalation ID: ${escalationId}` : '',
                    '',
                    `Message: ${escalationMessage}`
                ]
                    .filter(Boolean)
                    .join('\n')
            });

            return 'SENT';
        } catch (e) {
            log.error({ title: 'Workflow action failed: notify internal', details: e });
            throw e;
        }
    }

    return {
        onAction
    };
});
