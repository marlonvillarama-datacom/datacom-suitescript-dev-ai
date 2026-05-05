## Vendor Approval Workflow — SuiteFlow Configuration Guide

This document is the authoritative blueprint for building the SuiteFlow workflow for Vendor Approval in NetSuite. Build this workflow manually using the specification below.

---

## Workflow Header

| Setting | Value |
|---------|-------|
| Name | BEX Vendor Approval Workflow |
| Record Type | Vendor |
| Release Status | Testing |
| Execute as Admin | No |
| On Create | Yes |
| On Edit | No |
| Trigger Type | After Record Submit |
| Run as Role | (leave as current user) |

---

## Initiation

- **Condition:** None — all newly created Vendor records enter the workflow.
- The UE script (`bex_ue_vendor_approval`) sets `custentity_bex_vend_approval_status = Pending` and `isinactive = T` in `beforeSubmit`, so the vendor enters state 1 already locked.

---

## States

### STATE 1: Pending Approval

This is the initial/default state. The workflow enters here immediately after a new vendor is created.

**Set as Default State:** Yes

---

#### Entry Actions (run once when state is entered)

> Run these actions in the order listed.

---

##### Action 1 — Set Approval Status Field (belt-and-suspenders)

| Setting | Value |
|---------|-------|
| Action Type | Set Field Value |
| Field | Approval Status (`custentity_bex_vend_approval_status`) |
| Value | Pending |
| Condition | (none) |

---

##### Action 2a — Set Approver: Supervisor (credit limit ≤ $500)

| Setting | Value |
|---------|-------|
| Action Type | Set Field Value |
| Field | Approver (`custentity_bex_vend_approver`) |
| Value Type | Field Source |
| Value — Source Field | Submitted By (`custentity_bex_vend_submitted_by`) |
| Value — Source Field Path | Supervisor |
| Condition | Credit Limit (`creditlimit`) is less than or equal to `500` |

> **Note:** If the Employee record for the vendor submitter does not have a Supervisor set, the Approver field will be blank. Validate Employee records before go-live.

---

##### Action 2b — Set Approver: AP Manager (credit limit $501–$2,000)

| Setting | Value |
|---------|-------|
| Action Type | Set Field Value |
| Field | Approver (`custentity_bex_vend_approver`) |
| Value Type | Specific Employee (constant) |
| Value | **[Set to the AP Manager's Employee record internal ID — must be configured at deployment]** |
| Condition | Credit Limit > `500` AND Credit Limit ≤ `2000` |

---

##### Action 2c — Set Approver: CFO (credit limit > $2,000)

| Setting | Value |
|---------|-------|
| Action Type | Set Field Value |
| Field | Approver (`custentity_bex_vend_approver`) |
| Value Type | Specific Employee (constant) |
| Value | **[Set to the CFO's Employee record internal ID — must be configured at deployment]** |
| Condition | Credit Limit > `2000` |

---

##### Action 3 — Create Approval Task

| Setting | Value |
|---------|-------|
| Action Type | Create Record |
| Record Type | Task |
| **Title** | `Vendor Approval Required: {companyname}` |
| **Assigned To** | Field Reference → `custentity_bex_vend_approver` |
| **Due Date** | Today (`{today}`) |
| **Status** | Not Started |
| **Priority** | High |
| **Related To — Type** | Vendor |
| **Related To — Record** | Current Record (Internal ID) |
| Condition | (none — always create task) |

---

##### Action 4 — Email Approver

| Setting | Value |
|---------|-------|
| Action Type | Send Email |
| From | [Configure a system/noreply employee as sender] |
| To | Field Reference → `custentity_bex_vend_approver` |
| Subject | `Vendor Approval Required: {companyname}` |
| Condition | (none) |

**Email Body:**
```
A new vendor has been submitted for your approval.

Vendor Name:   {companyname}
Credit Limit:  {creditlimit}
Submitted By:  {custentity_bex_vend_submitted_by}

Please log into NetSuite to review and Approve or Reject this vendor.
```

---

#### Transitions (out of State 1)

| # | Condition | Trigger | Destination |
|---|-----------|---------|-------------|
| 1 | `custentity_bex_vend_approval_status` = Approved | Field Change | → **STATE 2: Approved** |
| 2 | `custentity_bex_vend_approval_status` = Rejected | Field Change | → **STATE 3: Rejected** |

> Both transitions should be configured to **evaluate on field change** (not on schedule). This ensures the workflow advances the moment the approver clicks Approve or Reject and the record is saved.

---

### STATE 2: Approved (Terminal)

The vendor is activated and the submitter is notified.

**Set as Default State:** No

---

#### Entry Actions

##### Action 1 — Activate Vendor

| Setting | Value |
|---------|-------|
| Action Type | Set Field Value |
| Field | Inactive (`isinactive`) |
| Value | False (unchecked) |
| Condition | (none) |

---

##### Action 2 — Email Submitter: Approved

| Setting | Value |
|---------|-------|
| Action Type | Send Email |
| From | [Same system sender as Action 4 in State 1] |
| To | Field Reference → `custentity_bex_vend_submitted_by` |
| Subject | `Vendor Approved: {companyname}` |
| Condition | (none) |

**Email Body:**
```
Your vendor record has been approved and is now active.

Vendor Name:  {companyname}
Approved By:  {custentity_bex_vend_approver}

The vendor is now available for use in transactions.
```

---

#### Transitions
*(none — terminal state)*

---

### STATE 3: Rejected (Terminal)

The vendor remains inactive. The submitter is notified with the rejection reason.

**Set as Default State:** No

---

#### Entry Actions

##### Action 1 — Email Submitter: Rejected

| Setting | Value |
|---------|-------|
| Action Type | Send Email |
| From | [Same system sender] |
| To | Field Reference → `custentity_bex_vend_submitted_by` |
| Subject | `Vendor Rejected: {companyname}` |
| Condition | (none) |

**Email Body:**
```
Your vendor record submission has been rejected.

Vendor Name:      {companyname}
Rejected By:      {custentity_bex_vend_approver}
Rejection Reason: {custentity_bex_vend_rejection_reason}

Please contact the AP team if you have questions.
```

---

#### Transitions
*(none — terminal state; vendor remains inactive)*

---

## Custom Fields Required (must exist before building workflow)

| Field Script ID | Label | Type | Used In |
|----------------|-------|------|---------|
| `custentity_bex_vend_approval_status` | Approval Status | SELECT (list) | Transition conditions, State 1 Action 1 |
| `custentity_bex_vend_approver` | Approver | SELECT (Employee) | Actions 2a/2b/2c, Action 3, Action 4 |
| `custentity_bex_vend_submitted_by` | Submitted By | SELECT (Employee) | Action 4, State 2 Action 2, State 3 Action 1 |
| `custentity_bex_vend_rejection_reason` | Rejection Reason | TEXTAREA | State 3 Action 1 email body |

---

## Post-Deployment Checklist

- [ ] Deploy SDF project (creates custom list and entity fields)
- [ ] Deploy UE and CS scripts; set script parameter values (list value internal IDs)
- [ ] Build SuiteFlow workflow per this guide
- [ ] Set AP Manager employee constant in Action 2b
- [ ] Set CFO employee constant in Action 2c
- [ ] Verify at least one Employee record has Supervisor populated (for ≤$500 tier testing)
- [ ] Test: Create vendor with creditlimit = 100 → verify Approver = submitter's supervisor
- [ ] Test: Create vendor with creditlimit = 1000 → verify Approver = AP Manager
- [ ] Test: Create vendor with creditlimit = 5000 → verify Approver = CFO
- [ ] Test: Approve flow → vendor becomes active, submitter receives email
- [ ] Test: Reject flow → vendor stays inactive, submitter receives email with reason
