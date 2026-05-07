---
name: solution-design-workflow
description: Solution Design Workflow
---

# Workflow Development

This skill provides guidelines for designing and developing solutions using workflows in NetSuite.

## Naming Conventions

- Use the prefix `_bex_wf_` for Workflow script IDs (e.g., `_bex_wf_salesorder`).

## Workflow Design and Architecture

### Record/Subrecord Types

- All workflows must have a base record type. The record subtype will only be required for the following record types:

    | Record Type | Subtypes |
    |-------------|----------|
    | Customer | <ul><li>Customer</li><li>Lead</li><li>Prospect</li></ul> |
    | Item | Any record of type Item |
    | Transaction | Any record of type Transaction |

### Initiation

- **Event-Based**: Choose this option if the workflow is to execute based on specific record events such as creation, update, deletion, or view. This allows for automation of processes in response to user actions or system events.
- **Scheduled**: Choose this option if the workflow is to run at specific times or intervals, allowing for automation of processes that need to occur on a regular basis, such as nightly data processing or weekly reports.

### Event Definition

- One or both of the following options may be selected based on the use case.
    - **On Create**: Trigger the workflow when a new record is created.
    - **On View or Update**: Trigger the workflow when an existing record is either viewed or updated.
- The trigger type should be chosen based on the logic below:
    - **Before Record Load** - Use this trigger type if the actions on the first state need to execute when the record is being viewed or edited, or if the actions need to execute before the record is loaded on the form.
    - **Before Record Submit** - Use this trigger type if the actions on the first state need to execute before the record is submitted/saved, such as for validation purposes.
    - **After Record Submit** - Use this trigger type if the actions on the first state need to execute after the record is submitted/saved, such as for creating related records or sending email notifications.

### Workflow States

- Design the workflow with a clear sequence of states and actions that align with the business process being automated. Use meaningful names for states instead of "State 1", "State 2", etc.
- For complex logic that cannot be achieved through standard workflow actions, consider using Workflow Action Scripts to execute custom SuiteScript code.

### Workflow Actions

- The actions within each state should be designed to perform specific tasks that contribute to the overall workflow process. Use the appropriate action types (e.g., Set Field Value, Send Email, Create Record) based on the requirements of each step in the workflow.
- The following table shows the available standard workflow actions and their corresponding SuiteScript equivalents, which can be used as a reference when determining if a Workflow Action Script is needed for complex logic. **The first specific "Available Trigger" is considered the default trigger for that action, although other triggers may also be applicable based on the use case.**

    | Workflow Action | SuiteScript Equivalent | Server or Client Side | Available Triggers |
    |-----------------|-----------------------|------------------------|---------------------|
    | Add Button | `serverWidget.Form.addButton()` with a client script to handle the redirection | Server | Before Record Load |
    | Confirm | `window.confirm()` | Client | Before User Submit, Before User Edit |
    | Create Record | `record.create()` followed by `record.save()` | Both | Entry, Exit, Before Record Load, Before Record Submit, After Record Submit, Scheduled |
    | Go To Page | `redirect.redirect()` or `redirect.toTaskLink()` or `redirect.toSavedSearch()` | Server | After Record Submit, Entry, Exit |
    | Go To Record | `redirect.toRecord()` | Server | After Record Submit, Entry, Exit |
    | Lock Record | No direct equivalent | Server | Before Record Load, Entry, Exit |
    | Remove Button | `serverWidget.Form.removeButton()` | Server | Before Record Load, Entry, Exit |
    | Return User Error | `throw error.create()` | Server | Before Record Submit, Before Record Load, Before User Edit, Before User Submit, Before Field Edit, After Field Edit, After Field Sourcing |
    | Send Email | `email.send()` | Server | After Record Submit, Entry, Exit |
    | Set Field Value | `record.submitFields()` or `record.save()` after setting the field value on the record | Server | Entry, Exit, Before Record Load, Before Record Submit, After Record Submit, Before User Edit |
    | Show Message | `window.alert()` | Client | Before User Edit, Before Field Edit, After Field Edit, After Field Sourcing, Before User Submit |

## Workflow Best Practices
- Refer to the following page for recommended best practices and guidelines for Workflow design in NetSuite: [SuiteFlow Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1540490044.html).
