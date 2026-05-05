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
 * @description             User Event script for the Vendor Approval workflow.
 *                            - beforeSubmit (CREATE): Sets Submitted By, locks vendor (isinactive=T),
 *                              and sets Approval Status to Pending.
 *                            - beforeSubmit (EDIT): Blocks any edits while the vendor is Pending
 *                              unless the current user is the assigned approver or an admin.
 *                            - beforeLoad (EDIT/VIEW): Injects Approve and Reject action buttons
 *                              for the assigned approver (or admin) when the vendor is Pending.
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2026-05-05           BEX Team                            Initial version
 *
 */
define(['N/runtime'], function (runtime) {

    const MODULE = 'BEX.UE.VendorApproval';

    const FIELD = {
        APPROVAL_STATUS:  'custentity_bex_vend_approval_status',
        APPROVER:         'custentity_bex_vend_approver',
        SUBMITTED_BY:     'custentity_bex_vend_submitted_by',
        IS_INACTIVE:      'isinactive'
    };

    // ─── Script Parameters ────────────────────────────────────────────────────────

    function getParams() {
        const s = runtime.getCurrentScript();
        return {
            pendingStatusId:  String(s.getParameter({ name: 'custscript_bex_ue_vend_pending_status' })  || ''),
            approvedStatusId: String(s.getParameter({ name: 'custscript_bex_ue_vend_approved_status' }) || ''),
            rejectedStatusId: String(s.getParameter({ name: 'custscript_bex_ue_vend_rejected_status' }) || ''),
            /** Internal ID of the role that bypasses the pending-edit restriction. Defaults to Administrator (3). */
            bypassRole:       String(s.getParameter({ name: 'custscript_bex_ue_vend_bypass_role' })     || '3')
        };
    }

    // ─── Entry Points ────────────────────────────────────────────────────────────

    /**
     * Injects Approve and Reject buttons when the vendor is Pending and
     * the current user is the assigned approver (or has the bypass role).
     *
     * @param {Object} context
     */
    function beforeLoad(context) {
        const TITLE = `${MODULE}.BeforeLoad`;
        const allowedTypes = [context.UserEventType.EDIT, context.UserEventType.VIEW];
        if (!allowedTypes.includes(context.type)) return;

        try {
            const rec    = context.newRecord;
            const user   = runtime.getCurrentUser();
            const params = getParams();

            const currentStatusId = String(rec.getValue({ fieldId: FIELD.APPROVAL_STATUS }) || '');
            const approverId      = String(rec.getValue({ fieldId: FIELD.APPROVER }) || '');
            const isPending       = params.pendingStatusId && currentStatusId === params.pendingStatusId;
            const isApprover      = approverId === String(user.id);
            const isAdmin         = String(user.role) === params.bypassRole;

            if (isPending && (isApprover || isAdmin)) {
                context.form.addButton({
                    id:           'custpage_btn_approve',
                    label:        'Approve',
                    functionName: 'onApproveClick'
                });
                context.form.addButton({
                    id:           'custpage_btn_reject',
                    label:        'Reject',
                    functionName: 'onRejectClick'
                });
            }
        } catch (e) {
            log.error({ title: `${TITLE} error`, details: e });
        }
    }

    /**
     * On CREATE: locks the vendor and stamps the submitter + pending status.
     * On EDIT:   blocks all changes while the vendor is Pending (non-approver/non-admin).
     *
     * @param {Object} context
     */
    function beforeSubmit(context) {
        const TITLE = `${MODULE}.BeforeSubmit`;
        try {
            const rec    = context.newRecord;
            const user   = runtime.getCurrentUser();
            const params = getParams();
            const types  = context.UserEventType;

            if (context.type === types.CREATE) {
                // Stamp the creator and lock the vendor
                rec.setValue({ fieldId: FIELD.SUBMITTED_BY, value: user.id });
                if (params.pendingStatusId) {
                    rec.setValue({ fieldId: FIELD.APPROVAL_STATUS, value: params.pendingStatusId });
                }
                rec.setValue({ fieldId: FIELD.IS_INACTIVE, value: true });
                log.audit({ title: TITLE, details: `Vendor locked pending approval. Submitted by: ${user.id}` });
            }

            if (context.type === types.EDIT) {
                const currentStatusId = String(rec.getValue({ fieldId: FIELD.APPROVAL_STATUS }) || '');
                const approverId      = String(rec.getValue({ fieldId: FIELD.APPROVER }) || '');
                const isPending       = params.pendingStatusId && currentStatusId === params.pendingStatusId;
                const isApprover      = approverId === String(user.id);
                const isAdmin         = String(user.role) === params.bypassRole;

                if (isPending && !isApprover && !isAdmin) {
                    throw new Error('This vendor is pending approval and cannot be edited until approved or rejected.');
                }
            }
        } catch (e) {
            log.error({ title: `${TITLE} error`, details: e });
            throw e;
        }
    }

    return { beforeLoad, beforeSubmit };
});
