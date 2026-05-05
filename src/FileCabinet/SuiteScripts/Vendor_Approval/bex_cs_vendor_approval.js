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
 * @description             Client-side handler for the Vendor Approval workflow.
 *                            - pageInit: Registers the onApproveClick and onRejectClick window
 *                              functions used by the buttons injected by the UE script.
 *                            - saveRecord: Validates that a Rejection Reason is provided whenever
 *                              the Approval Status is set to Rejected before allowing the save.
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * 2026-05-05           BEX Team                            Initial version
 *
 */
define(['N/currentRecord', 'N/runtime'], function (currentRecord, runtime) {

    const MODULE = 'BEX.CS.VendorApproval';

    const FIELD = {
        APPROVAL_STATUS:  'custentity_bex_vend_approval_status',
        REJECTION_REASON: 'custentity_bex_vend_rejection_reason'
    };

    // ─── Entry Points ────────────────────────────────────────────────────────────

    /**
     * Registers global button handler functions on the window object.
     * These are called by the Approve/Reject buttons injected by the UE script.
     *
     * @param {Object} context
     * @param {N/currentRecord.CurrentRecord} context.currentRecord
     * @param {string} context.mode
     */
    function pageInit(context) {
        try {
            const script     = runtime.getCurrentScript();
            const approvedId = script.getParameter({ name: 'custscript_bex_cs_vend_approved_status' });
            const rejectedId = script.getParameter({ name: 'custscript_bex_cs_vend_rejected_status' });

            /**
             * Called when the "Approve" button is clicked.
             * Sets approval status to Approved and saves the record.
             */
            window.onApproveClick = function () {
                try {
                    if (!approvedId) {
                        alert('Configuration error: Approved status parameter is not set. Please contact your administrator.');
                        return;
                    }
                    const rec = currentRecord.get();
                    rec.setValue({ fieldId: FIELD.APPROVAL_STATUS, value: approvedId, ignoreFieldChange: false });
                    rec.save();
                } catch (err) {
                    log.error({ title: `${MODULE}.onApproveClick`, details: err });
                    alert('An error occurred while approving the vendor. Please try again or contact your administrator.');
                }
            };

            /**
             * Called when the "Reject" button is clicked.
             * Prompts the approver for a rejection reason, then saves with Rejected status.
             */
            window.onRejectClick = function () {
                try {
                    if (!rejectedId) {
                        alert('Configuration error: Rejected status parameter is not set. Please contact your administrator.');
                        return;
                    }
                    const reason = window.prompt('Please enter the reason for rejecting this vendor:');
                    if (reason === null) return; // user cancelled

                    if (!reason.trim()) {
                        alert('A rejection reason is required.');
                        return;
                    }

                    const rec = currentRecord.get();
                    rec.setValue({ fieldId: FIELD.REJECTION_REASON, value: reason.trim(),  ignoreFieldChange: true });
                    rec.setValue({ fieldId: FIELD.APPROVAL_STATUS,  value: rejectedId,     ignoreFieldChange: false });
                    rec.save();
                } catch (err) {
                    log.error({ title: `${MODULE}.onRejectClick`, details: err });
                    alert('An error occurred while rejecting the vendor. Please try again or contact your administrator.');
                }
            };
        } catch (e) {
            log.error({ title: `${MODULE}.pageInit`, details: e });
        }
    }

    /**
     * Validates that a Rejection Reason is present when the Approval Status is Rejected.
     * Acts as a last line of UI defence alongside the window.prompt validation in onRejectClick.
     *
     * @param {Object} context
     * @param {N/currentRecord.CurrentRecord} context.currentRecord
     * @returns {boolean}
     */
    function saveRecord(context) {
        try {
            const rec        = context.currentRecord;
            const script     = runtime.getCurrentScript();
            const rejectedId = script.getParameter({ name: 'custscript_bex_cs_vend_rejected_status' });

            const currentStatusId = String(rec.getValue({ fieldId: FIELD.APPROVAL_STATUS }) || '');
            const isRejected      = rejectedId && currentStatusId === rejectedId;

            if (isRejected) {
                const reason = rec.getValue({ fieldId: FIELD.REJECTION_REASON });
                if (!reason || !String(reason).trim()) {
                    alert('A Rejection Reason is required when rejecting a vendor.');
                    return false;
                }
            }
            return true;
        } catch (e) {
            log.error({ title: `${MODULE}.saveRecord`, details: e });
            alert('An unexpected error occurred. Please try again.');
            return false;
        }
    }

    return { pageInit, saveRecord };
});
