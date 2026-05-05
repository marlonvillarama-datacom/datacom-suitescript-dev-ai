Here you go — the full document in one block:

---

# Case Escalation - Technical Requirements and Design

## Summary

This document outlines the technical requirements and the design of a custom Case Escalation framework in NetSuite to support the Collections Case Management.

Due to limitations in standard NetSuite escalation functionality, a custom solution will be implemented.

The solution is based on the principal:

> Each Case Escalation record represents a single escalatee (internal i.e. within Collections team, or External i.e. outside of collections team) and a single unit of responsibility.

This ensures:

- Clear ownership
- Controlled notifications
- Independent lifecycle tracking
- Strong auditability

---

## Assumptions

- Case record exists prior to escalation creation
- Multiple escalations will be recorded per case
- Each escalation is a single unit of work and assigned to one escalatee only
- External escalatees do not access/update the case or escalation records
- External escalatees refers to Datacom Employees outside of collections team
- Internal escalatees refers to Employees within the Datacom Collections Team
- Internal escalatees receive notification on creation of escalation ONLY
- Cases will only be escalated to Employees and NO other entities like Vendors, Customers etc

---

## In Scope

- Creation and management of multiple case escalation records per case
- Each escalation assigned to one escalatee only
- Support for:
  - Internal escalations (with notifications)
  - External escalations (no notifications)
- Response tracking via:
  - Case > Communication > Messages (full communication)
  - Escalation Response records (structured audit)
- Escalation lifecycle management
- De-escalation with mandatory reason
- Reporting and audit trail

## Out of Scope

- External email communication with the external escalatees will not be tracked via case record or case escalation record

---

## Escalation Process

### Custom Record Structure

+----------------------------------------------------------+
|  Parent: Case Record                                     |
|                                                          |
|   +--------------------------------------------------+   |
|   |  Case Escalation Record:                         |   |
|   |  Child Record of Case Record                     |   |
|   |                                                  |   |
|   |   +------------------------------------------+   |   |
|   |   |  Escalation Response Record:             |   |   |
|   |   |  Child Record of Case Escalation Record  |   |   |
|   |   +------------------------------------------+   |   |
|   |                                                  |   |
|   +--------------------------------------------------+   |
|                                                          |
+----------------------------------------------------------+

### Escalation Process

ESCALATION PROCESS

                                      ( Start )
                                          |
                                          v
                             +---------------------------+
                             | 1. Collector creates case |
                             |  escalation record for    |
                             |      existing case        |
                             +---------------------------+
                                          |
                                          v
                             +---------------------------+
                             |  2. Create Case Escalation|
                             |   record (Single          |
                             |       Escalatee)          |
                             +---------------------------+
                                          |
                                          v
                             +---------------------------+
                             | 3. Update the escalation  |
                             | type, escalatee, message  |
                             | and other relevant fields |
                             | and save the case         |
                             | escalation record         |
                             +---------------------------+
                                          |
                                          v
+-----------------------------+    +-----------------------------+    +-----------------------------+
| 4. Case Escalation Status   |--->| 5. Case Escalation button   |--->| 6. On Clicking "Escalate"   |
|   set to "Not Escalated"    |    |         visible             |    |           Button            |
+-----------------------------+    +-----------------------------+    +-----------------------------+
                                                                                   |
                                          +----------------------------------------+
                                          |                                         |
                                          v                                         v
                             +---------------------------+             +---------------------------+
                             | 7. Case Escalation Record:|             | 9. De-Escalate button     |
                             |  Escalation Status set to |             |      becomes visible      |
                             |       "Escalated"         |             +---------------------------+
                             +---------------------------+
                                          |
                                          v
                             +---------------------------+
                             | 8. Case Escalation Record:|
                             | If at least one escalation|
                             | record exists, set parent |
                             | case record status =      |
                             |       "Escalated"         |
                             +---------------------------+
                                          |
                                          v
                                        (END)


                                          |
                                    (from step 6)
                                          |
                                          v
                                    +----------+
                                    |    [+]   |  (parallel flow)
                                    +----------+
                                          |
                                          v
                                   < Escalation >
                                   <    Type    >
                                  /              \
           Internal                /              \              External
       (Collections Team)         /                \        (outside collections team)
                                 /                  \
                                v                    v
               +-----------------------------+    +-----------------------------+
               | 10. Send Email Notification |    | 12. Do not send email       |
               |      to the escalatee       |    |       notifications         |
               +-----------------------------+    +-----------------------------+
                             |                                   |
                             v                                   v
               +-----------------------------+               ( END )
               | 11. Attach the Notification |
               |  to Case > Communication    |
               |        > Messages           |
               +-----------------------------+
                             |
                             v
                           ( END )

### Add Responses to Escalations

( Start )
                          |
                          v
             +---------------------------+
             |  Case Assignee / Internal |
             |  Escalatee opens the case |
             |  > case escalation record |
             +---------------------------+
                          |
                          v
             +---------------------------+
             | Create a case escalation  |
             | response child record to  |
             | add the response to the   |
             |   case escalation record  |
             +---------------------------+
                          |
                          v
                        ( END )

### De-escalation Process

( Start )
                          |
                          v
             +---------------------------+
             |  Open the case escalation |
             |          record           |
             +---------------------------+
                          |
                          v
             +---------------------------+ <--------------------------+
             |  Click on the             |                            |
             |  "De-escalation" button   |                            |
             +---------------------------+                            |
                          |                                           |
                          v                                           |
                  < De-escalation >                                   |
                  < reason entered?>                                  |
                  /               \                                   |
               Yes                 No                                 |
                |                   |                                 |
                v                   v                                 |
                |      +---------------------------+                  |
                |      | Throw an error to prompt  |                  |
                |      | the user to enter the     |------------------+
                |      |   de-escalation reason    |
                |      +---------------------------+
                |
                v
   +---------------------------+
   | Workflow triggered to set |
   | Escalation Status to      |
   |      "De-escalated"       |
   +---------------------------+
                |
                v
   +---------------------------+
   | If all the escalation     |
   | records of a case are set |
   | to "De-escalated" status  |
   | then set the case to      |
   |       "In-Progress"       |
   +---------------------------+
                |
                v
             ( END )

---

## Process

### Goal

Allowing the case assignee to escalate cases to Internal (within Collections team) and External (outside of Collections team) escalatees by:

- Enabling clear ownership per escalation
- Supporting multiple independent escalations
- Controlling notifications (internal only)
- Providing structured audit trail
- Ensuring scalability and reporting capability

### Business Rules

- Each escalation must have one escalatee only
- Escalation type:
  - Internal = Within collections team
  - External = Outside of collections team
- Internal escalatees receive notifications on creation of escalation
- External escalatees do NOT receive notifications
- Multiple escalations allowed per case
- De-escalation requires a mandatory reason
- Case is escalated if any escalation is active
- Case is de-escalated only if all escalations are de-escalated

### Business Event / Trigger

- Case Escalation created
- Case Escalation updated
- Escalation Response recorded
- Case Escalation closed

### Frequency

*(TBC)*

### Actor(s)

- NetSuite (System)

### Pre-conditions

- Case exists

### Post-conditions

- Case Escalation record created
- Notification sent (if internal)
- Escalation Response tracked
- Case escalation status updated
- Audit trail maintained

### Alternate Flows

*(None specified)*

### Exception Flows

- While creating a case escalation record, if escalatee is not selected then the record save should be blocked.
- While de-escalating a case escalation record, if the de-escalation reason is not entered then throw an error and block the record save.

### Non-Functional Requirements

None

---

## Data Model

- **Custom Record:** Case Escalation Record
- **Custom Record:** Case Escalation Response
- **Workflow:** Validations on creation of Case Escalation Record and controlling the escalation lifecycle
- **Workflow Action Script:**
  - To set the Parent Case Record status to "Escalated" when there is at least 1 child case escalation record
  - To set the Parent Case Record status to "In-Progress" when there are no child case escalation records
- **Workflow Action Script:**
  - To send out escalation email notifications to the internal escalatee if the escalation type = Internal

---

## Solution Design

### Custom Records

#### Case Escalation

Custom record to record escalations for cases. There can be multiple case escalations recorded against a case.

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR01: Escalation Record | |

**Create a custom list "Escalation Type List" with the following values:**

- Internal
- External

**Create a custom list "Escalation Status" with the following values:**

- Not Escalated
- Escalated
- De-escalated

**Create a custom record "Case Escalation" as child record of Case for recording escalations for a case.**

The "Case Escalation" custom record should have the following fields:

**Parent Case**
- Mandatory: Yes
- Type: List/Record → Case
- Display: Inline
- Description: The parent case ID of the escalation record

**Escalation Type**
- Mandatory: Yes
- Type: List/Record → Escalation Type List (Custom List)
- Display: Normal
- Description: Denotes if the escalation is to internal or external escalatees

**Internal Escalatee**
- Mandatory:
  - Yes: if the escalation type = Internal
  - No: if the escalation type = External
- Type: List/Record → Employee
- Display (Controlled by workflow):
  - Inline: if the escalation type is "External"
  - Normal: if the escalation type is "Internal"
- Sourcing and Filtering: Add a filter to source only Employees who have the role "Datacom Credit Controller" or "Datacom A/R Collections Manager"
- Description: This field holds the internal escalatee the case will be escalated to. This field will be editable only if the escalation type is "Internal"

**External Escalatee**
- Mandatory:
  - Yes: if the escalation type = External
  - No: if the escalation type = Internal
- Type: List/Record → Employee
- Display:
  - Inline: if the escalation type is "Internal"
  - Normal: if the escalation type is "External"
- Sourcing and Filtering: Add a filter to source only Employees who do NOT have the role "Datacom Credit Controller" or "Datacom A/R Collections Manager"
- Description: This field holds the external escalatee the case will be escalated to. This field will be editable only if the escalation type is "External"

**Escalation Status**
- Mandatory: Yes
- Type: List/Record → "Escalation Status" (custom list)
- Display: Inline
- Description: Denotes the status of the escalation, if it's escalated or de-escalated

**Escalation Message**
- Mandatory: Yes
- Type: Text
- Display: Normal
- Description: This field denotes the escalation reason/message

**De-escalation Reason**
- Mandatory: Controlled through customisation
  - Yes: if the escalation status is "De-escalated"
  - No: if the escalation status is "Escalated"
- Display: Normal

**Escalation Start Date**
- Mandatory: Yes
- Type: Date
- Display: Normal
- Defaulting: Defaulted to today's date
- Description: The start date of the escalation

**Escalation End Date**
- Mandatory: No
- Type: Date
- Display: Inline
- Description: Automatically entered on clicking the de-escalate button

---

#### Case Escalation Response

Child record of the Case Escalation custom record to record responses from escalatees.

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR02: Case Escalation Response | |

**Create custom record "Case Escalation Response" as child record of the custom record "Case Escalation".**

The "Case Escalation Response" should have the following fields:

**Case Escalation**
- Mandatory: Yes
- Type: List/Record → Case Escalation
- Display: Inline
- Description: Stores the parent case escalation record ID

**Response Message**
- Mandatory: Yes
- Type: Text
- Display: Normal
- Description: The field to record the response message

**Response Date**
- Mandatory: Yes
- Type: Date
- Display: Normal
- Default: Automatically defaults to today's date
- Description: The field to record the response date

**Posted by**
- Mandatory: No
- Type: List/Record → Employee
- Display: Inline
- Default: Defaulted to user creating the record
- Description: The employee entering the comments

**On behalf of**
- Mandatory: No
- Type: List/Record → Employee
- Display: Normal
- Description: Update this field if the "Posted by" is different from the person who has provided the response from the business

---

### Escalation Email Notifications

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR03: Escalation Notification Email Template | |

Create an Email Notification Template with standard information to be sent out to internal escalatees upon case escalation creation.

The script to send out the notification on creation of case escalation should read the email template, add the escalation message, and send it out to the internal escalatee.

> **@noah** TBC: The content of the Escalation Notification Email sent out

---

### Workflow

#### Case Escalation Record

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR04: Case Escalation Record Validation and Lifecycle | |

**When the Escalation Type = Internal:**
- The Internal Escalatee should be set to DISPLAY = Normal and Mandatory
- The External Escalatee should be set to DISPLAY = DISABLED and non-mandatory
- Clear External Escalatee field if it has values

**When the Escalation Type = External:**
- The External Escalatee should be set to DISPLAY = Normal and Mandatory
- The Internal Escalatee should be set to DISPLAY = DISABLED and non-mandatory
- Clear Internal Escalatee field if it has values

**The Escalation Lifecycle:**

*On Creation of Case Escalation Record:*
- The escalation status should be set to "Not Escalated"
- If the escalation message is not entered, throw an error
- The Escalate button should be available on save

*On Clicking the Escalate Button:*
- The escalation status should be set to "Escalated"
- The Workflow Action Script to be called to set the parent case record status to "Escalated" (if not already escalated)
- If the escalation type = Internal:
  - Workflow Action Script to be called to send out email notification to the internal escalatee
- The De-escalate button should be visible

*On Clicking the De-escalate Button:*
- There should be a validation to check the de-escalation message
- If de-escalation message not entered, throw error

---

### Workflow Action Script — Set Parent Case Record Status

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR05: Updates to Case Record status field when case is escalated and de-escalated | |

- **Type:** Workflow action script
- **Purpose:**
  - Set the Parent Case Record to "Escalated" if at least one of the child case escalation records is set to Escalated status
  - Set the Parent Case Record to "In Progress" only if all of the child case escalation records are set to De-escalated status
- **Deploy:** Escalation Case Record
- **Triggers (Workflow):**
  - On clicking the "Escalate" button
  - On clicking the "De-escalate" button

**Logic:**

```
If Parent_Case_Record.Status != "Escalated" THEN
    Set Parent_Case_Record.Status to "Escalated"
ELSE
    If Parent_Case_Record.Status == "Escalated"
        Set Parent_Case_Record.Status to "In Progress"
```

---

### Workflow Action Script — Send Email Notifications to Internal Escalatees

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR06: To send out email notifications to internal escalatees on case escalation record creation | |

- **Type:** Workflow action script
- **Purpose:** If a case escalation is created for internal escalation then the internal escalatee should be notified
- **Deploy:** Escalation Case Record
- **Triggers:** On clicking the Escalate button in the workflow

**Logic:**
1. Get the Case Escalation Type, Escalation Message, and Parent Case from the case escalation record
2. If the Escalation Type = Internal:
   - Read the escalation email template
   - Get the Email Subject and Email Body
   - Inject the escalation message into the email body
   - Send the email to the internal escalatee
   - Add the message to Case > Communication > Messages

---

### Map Reduce Script [OPTIONAL]

| # | Description | Jira |
|---|-------------|------|
| 1 | CE_TR07: Recovery script to update Case Record status field when case is escalated and de-escalated | |

- **Type:** Map Reduce Script
- **Purpose:**
  - Set the Parent Case Record to "Escalated" if at least one of the child case escalation records is set to Escalated status
  - Set the Parent Case Record to "In Progress" if all of the child case escalation records are set to De-escalated status
- **Deploy:** Scheduled every 15 minutes

**Logic:**
1. Get all case escalations grouped by `Parent_Case_Record.id`
2. For each Parent Case record from step 1, check if there are any child case escalation records with `status = Escalated`
3. If **Yes**:
   - `IF Parent_Case_Record.Status != "Escalated"`
   - Set `Parent_Case_Record.status = "Escalated"`
4. If **No**:
   - `IF Parent_Case_Record.Status == "Escalated"`
   - Set `Parent_Case_Record.status = "In-Progress"`

---

*End of document.*