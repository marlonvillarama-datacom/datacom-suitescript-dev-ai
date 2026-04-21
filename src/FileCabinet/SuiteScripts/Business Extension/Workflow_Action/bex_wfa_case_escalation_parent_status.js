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
 * @description             Workflow Action Script to sync parent Case status based on
 *                          active child Case Escalation records.
 *
 * Script Parameters:
 *  - custscript_bex_ce_rec_type                Escalation record type (default: customrecord_bex_case_escalation)
 *  - custscript_bex_ce_parent_case_field       Parent Case field ID (default: custrecord_bex_ce_parent_case)
 *  - custscript_bex_ce_status_field            Escalation status field ID (default: custrecord_bex_ce_status)
 *  - custscript_bex_ce_status_escalated        Escalated list value internal ID
 *  - custscript_bex_ce_case_status_field       Case status field ID (default: status)
 *  - custscript_bex_ce_case_status_escalated   Case status value internal ID for Escalated
 *  - custscript_bex_ce_case_status_inprog      Case status value internal ID for In Progress
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 21/04/2026           Copilot                             Initial version
 *
 */

define(
    [
        'N/runtime',
        'N/search',
        'N/record',
    ],
    (
        runtime,
        search,
        record,
    ) => {
        const MODULE = 'BEX.WFA.CaseEscalation.ParentStatus';
        const DEFAULTS = {
            escalationRecordType: 'customrecord_bex_case_escalation',
            parentCaseFieldId: 'custrecord_bex_ce_parent_case',
            escalationStatusFieldId: 'custrecord_bex_ce_status',
            parentCaseStatusFieldId: 'status',
        };
        const PARAMS = {
            escalationRecordType: 'custscript_bex_ce_rec_type',
            parentCaseFieldId: 'custscript_bex_ce_parent_case_field',
            escalationStatusFieldId: 'custscript_bex_ce_status_field',
            escalatedStatusValue: 'custscript_bex_ce_status_escalated',
            parentCaseStatusFieldId: 'custscript_bex_ce_case_status_field',
            parentEscalatedStatusValue: 'custscript_bex_ce_case_status_escalated',
            parentInProgressStatusValue: 'custscript_bex_ce_case_status_inprog',
        };

        const getParam = ({ id, fallback = '' }) => {
            return runtime.getCurrentScript().getParameter({ name: id }) || fallback;
        };

        const readConfig = () => {
            return {
                escalationRecordType: getParam({ id: PARAMS.escalationRecordType, fallback: DEFAULTS.escalationRecordType }),
                parentCaseFieldId: getParam({ id: PARAMS.parentCaseFieldId, fallback: DEFAULTS.parentCaseFieldId }),
                escalationStatusFieldId: getParam({ id: PARAMS.escalationStatusFieldId, fallback: DEFAULTS.escalationStatusFieldId }),
                escalatedStatusValue: getParam({ id: PARAMS.escalatedStatusValue }),
                parentCaseStatusFieldId: getParam({ id: PARAMS.parentCaseStatusFieldId, fallback: DEFAULTS.parentCaseStatusFieldId }),
                parentEscalatedStatusValue: getParam({ id: PARAMS.parentEscalatedStatusValue }),
                parentInProgressStatusValue: getParam({ id: PARAMS.parentInProgressStatusValue }),
            };
        };

        const countEscalatedChildren = ({ cfg, parentCaseId }) => {
            const escalationSearch = search.create({
                type: cfg.escalationRecordType,
                filters: [
                    [cfg.parentCaseFieldId, 'anyof', parentCaseId],
                    'AND',
                    [cfg.escalationStatusFieldId, 'anyof', cfg.escalatedStatusValue],
                ],
                columns: ['internalid'],
            });

            const result = escalationSearch.runPaged({ pageSize: 1 });
            return result.count || 0;
        };

        const updateParentStatus = ({ cfg, parentCaseId, statusValue }) => {
            record.submitFields({
                type: record.Type.SUPPORT_CASE,
                id: parentCaseId,
                values: {
                    [cfg.parentCaseStatusFieldId]: statusValue,
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                },
            });
        };

        const onAction = (scriptContext) => {
            const TITLE = `${MODULE}.OnAction`;
            const cfg = readConfig();
            const escalationRecord = scriptContext.newRecord;
            const parentCaseId = escalationRecord.getValue({ fieldId: cfg.parentCaseFieldId });

            if (!parentCaseId) {
                log.audit({ title: TITLE, details: 'No parent case found on escalation record. Exiting.' });
                return 'NO_PARENT_CASE';
            }
            if (!cfg.escalatedStatusValue || !cfg.parentEscalatedStatusValue || !cfg.parentInProgressStatusValue) {
                throw new Error('Missing required script parameter(s) for escalation status mapping.');
            }

            const escalatedChildCount = countEscalatedChildren({ cfg, parentCaseId });
            const targetStatus = escalatedChildCount > 0 ?
                cfg.parentEscalatedStatusValue :
                cfg.parentInProgressStatusValue;

            updateParentStatus({ cfg, parentCaseId, statusValue: targetStatus });
            log.audit({
                title: TITLE,
                details: `Parent case ${parentCaseId} status updated. Escalated children: ${escalatedChildCount}; target status value: ${targetStatus}`,
            });

            return targetStatus;
        };

        return {
            onAction,
        };
    }
);
