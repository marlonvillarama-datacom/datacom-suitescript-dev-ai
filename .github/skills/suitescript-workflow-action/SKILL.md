---
name: suitescript-workflow-action
description: Use this skill to design and develop Workflow Action Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Workflow Action Script Development

This skill provides best practices and guidelines for developing Workflow Action Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Workflow Action Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Workflow Action Scripts.
- Use the prefix `bex_wa_` for Workflow Action Script files (e.g., `bex_wa_salesorder.js`).
- Use camelCase for function and variable names (e.g., `onAction`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `validateCustomerCreditLimit`).

## Script Design and Architecture

- Organize the script into sections: entry points, helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.

### Entry Point Definitions and Context
- `onAction`: Executes when the workflow action is triggered. Use this entry point to perform the necessary processing for the workflow action, such as updating record fields, creating related records, or performing calculations.

### Example Workflow Action Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             WorkflowActionScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Workflow Action Script description goes here...
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * <today>              <your_name>                         Initial version
 */

define(['N/record'], function(record) {

    // Helper functions for complex logic can be defined here

    return {
        /**
            * @param {Object} context
            * @param {Form} context.form - The current form being loaded
            * @param {Record} context.newRecord - The new record being loaded
            * @param {Record} context.oldRecord - The old record being loaded (only available for edit operations)
            * @param {string} context.type - The type of operation (create, edit, view, copy)
            * @param {string} context.workflowId - The ID of the workflow triggering the action
            */
        onAction: function ({ form, newRecord, oldRecord, type, workflowId }) {
            // Entry point for onAction
            // Delegate complex logic to helper functions
        }
    };
});
```

### Governance and Performance Optimization
- **Workflow Action scripts have a governance limit of 1,000 points per execution.**
- If the estimated governance points of a Workflow Action Script is expected to exceed its governance limit, consider offloading the processing to a Map/Reduce script and invoking it asynchronously from the Workflow Action Script using `N/task` module.

## Deployment
- Deploy Workflow Action Scripts to the appropriate record types and events based on the use case.
- Use the following XML structure to deploy the Workflow Action Script in NetSuite using SDF:

```xml
<workflowactionscript scriptid="customscript_workflow_action_example">
    <name>Workflow Action Example</name>
    <notifyowner>T</notifyowner>
    <scriptfile>[/SuiteScripts/WorkflowActionScript.js]</scriptfile>
    <scriptcustomfields>
        <scriptcustomfield scriptid="custscript_wa_custom_field">
            <displaytype>NORMAL</displaytype>
            <fieldtype>TEXT</fieldtype>
            <ismandatory>F</ismandatory>
            <label>Workflow Action Custom Field</label>
            <selectrecordtype>Workflow Action Custom Field</selectrecordtype>
            <storevalue>T</storevalue>
        </scriptcustomfield>
    </scriptcustomfields>
   <scriptdeployments>
        <scriptdeployment scriptid="customdeploy_workflow_action_example">
            <isdeployed>T</isdeployed>
            <loglevel>DEBUG</loglevel>
            <recordtype>[customrecord_workflow_action_example]</recordtype>
            <status>TESTING</status>
            <title>Workflow Action Example Deployment</title>
        </scriptdeployment>
    </scriptdeployments>
</workflowactionscript>
```

## Workflow Action Script Best Practices
- Refer to the following page for recommended best practices and guidelines for Workflow Action Script development in NetSuite: [Workflow Action Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361453.html).
