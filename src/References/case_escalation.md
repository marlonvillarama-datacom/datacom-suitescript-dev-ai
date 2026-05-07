# Case Escalation Technical Design

## Assumptions

- NetSuite Case records exist prior to escalation.

## Core Business Requirements

- Each case may be escalated multiple times.
- Cases will only be escalated to employees and NOT to other entities (customers, vendors)
- There are two types of escalatees - internal and external. Internal escalatees refer to employees within the Datacom Collections Team.
- External escalatees refer to all other employees.
- Internal escalatees must receive email notifications only after escalations are created.

## Case Escalation Requirements

- Each case escalation must be recorded and linked to the parent case record.
- Only employees with specific roles have the ability to update the escalation details or add notes.
- Each case escalation must contain the following required details:
    - Start Date - This is the date the escalation was created.
    - End Date - This is the date when the "De-escalate" button was clicked.
    - Employee - The employee who created the escalation.
    - Escalatee - The employee to whom the escalation is being addressed.
    - Type (Internal/External)
    - Message
    - De-escalation Reason - Only required when the "De-escalate" button is clicked.
- If a case has at least one active escalation, the case status should be "Escalated".
- Individual case escalations may be "de-escalated" by clicking a button. A reason must be recorded on the escalation record.
- If a case has no active escalations, the case status should be "In Progress".

