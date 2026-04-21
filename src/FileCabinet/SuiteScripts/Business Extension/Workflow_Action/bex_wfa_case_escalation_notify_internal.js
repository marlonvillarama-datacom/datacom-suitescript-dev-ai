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
 * @description             Workflow Action Script to send escalation notification
 *                          to internal escalatees only.
 *
 * Script Parameters:
 *  - custscript_bex_ce_notify_type_field          Escalation type field ID (default: custrecord_bex_ce_type)
 *  - custscript_bex_ce_notify_internal_type       Internal escalation type value internal ID
 *  - custscript_bex_ce_notify_internal_emp_field  Internal escalatee field ID (default: custrecord_bex_ce_internal_escalatee)
 *  - custscript_bex_ce_notify_msg_field           Escalation message field ID (default: custrecord_bex_ce_message)
 *  - custscript_bex_ce_notify_parent_case_field   Parent case field ID (default: custrecord_bex_ce_parent_case)
 *  - custscript_bex_ce_notify_sender              Sender employee internal ID
 *  - custscript_bex_ce_notify_template            Email template internal ID
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 21/04/2026           Copilot                             Initial version
 *
 */

define(
    [
        'N/runtime',
        'N/render',
        'N/email',
    ],
    (
        runtime,
        render,
        email,
    ) => {
        const MODULE = 'BEX.WFA.CaseEscalation.NotifyInternal';
        const DEFAULTS = {
            escalationTypeFieldId: 'custrecord_bex_ce_type',
            internalEscalateeFieldId: 'custrecord_bex_ce_internal_escalatee',
            escalationMessageFieldId: 'custrecord_bex_ce_message',
            parentCaseFieldId: 'custrecord_bex_ce_parent_case',
        };
        const PARAMS = {
            escalationTypeFieldId: 'custscript_bex_ce_notify_type_field',
            internalEscalationTypeValue: 'custscript_bex_ce_notify_internal_type',
            internalEscalateeFieldId: 'custscript_bex_ce_notify_internal_emp_field',
            escalationMessageFieldId: 'custscript_bex_ce_notify_msg_field',
            parentCaseFieldId: 'custscript_bex_ce_notify_parent_case_field',
            senderEmployeeId: 'custscript_bex_ce_notify_sender',
            templateId: 'custscript_bex_ce_notify_template',
        };

        const getParam = ({ id, fallback = '' }) => {
            return runtime.getCurrentScript().getParameter({ name: id }) || fallback;
        };

        const readConfig = () => {
            return {
                escalationTypeFieldId: getParam({ id: PARAMS.escalationTypeFieldId, fallback: DEFAULTS.escalationTypeFieldId }),
                internalEscalationTypeValue: getParam({ id: PARAMS.internalEscalationTypeValue }),
                internalEscalateeFieldId: getParam({ id: PARAMS.internalEscalateeFieldId, fallback: DEFAULTS.internalEscalateeFieldId }),
                escalationMessageFieldId: getParam({ id: PARAMS.escalationMessageFieldId, fallback: DEFAULTS.escalationMessageFieldId }),
                parentCaseFieldId: getParam({ id: PARAMS.parentCaseFieldId, fallback: DEFAULTS.parentCaseFieldId }),
                senderEmployeeId: getParam({ id: PARAMS.senderEmployeeId }),
                templateId: getParam({ id: PARAMS.templateId }),
            };
        };

        const mergeTemplate = ({ cfg, parentCaseId, recipientId }) => {
            return render.mergeEmail({
                templateId: Number(cfg.templateId),
                supportCaseId: Number(parentCaseId),
                recipient: Number(recipientId),
            });
        };

        const onAction = (scriptContext) => {
            const TITLE = `${MODULE}.OnAction`;
            const cfg = readConfig();
            const escalationRecord = scriptContext.newRecord;

            if (!cfg.internalEscalationTypeValue || !cfg.senderEmployeeId || !cfg.templateId) {
                throw new Error('Missing required script parameter(s) for escalation notification.');
            }

            const escalationTypeValue = String(escalationRecord.getValue({ fieldId: cfg.escalationTypeFieldId }) || '');
            if (escalationTypeValue !== String(cfg.internalEscalationTypeValue)) {
                log.audit({ title: TITLE, details: 'Escalation type is not Internal. Notification skipped.' });
                return 'SKIPPED_NOT_INTERNAL';
            }

            const internalEscalateeId = escalationRecord.getValue({ fieldId: cfg.internalEscalateeFieldId });
            const escalationMessage = escalationRecord.getValue({ fieldId: cfg.escalationMessageFieldId }) || '';
            const parentCaseId = escalationRecord.getValue({ fieldId: cfg.parentCaseFieldId });
            if (!internalEscalateeId) {
                throw new Error('Internal escalatee is required for Internal escalation notifications.');
            }
            if (!parentCaseId) {
                throw new Error('Parent Case is required for escalation notifications.');
            }

            const merged = mergeTemplate({
                cfg,
                parentCaseId,
                recipientId: internalEscalateeId,
            });
            const bodyWithMessage = `${merged.body || ''}<br/><br/><strong>Escalation Message:</strong><br/>${escalationMessage}`;

            email.send({
                author: Number(cfg.senderEmployeeId),
                recipients: [Number(internalEscalateeId)],
                subject: merged.subject || 'Case Escalation Notification',
                body: bodyWithMessage,
                relatedRecords: {
                    activityId: Number(parentCaseId),
                },
            });

            log.audit({
                title: TITLE,
                details: `Internal escalation notification sent. Parent Case: ${parentCaseId}; Recipient: ${internalEscalateeId}`,
            });
            return 'SENT';
        };

        return {
            onAction,
        };
    }
);
