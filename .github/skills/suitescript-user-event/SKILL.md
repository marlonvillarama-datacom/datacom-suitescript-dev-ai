---
name: suitescript-user-event
description: Use this skill to design and develop User Event Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript User Event Script Development

This skill provides best practices and guidelines for developing User Event Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable User Event Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for User Event Scripts.
- Use the prefix `bex_ue_` for User Event Script files (e.g., `bex_ue_salesorder.js`).
- Use camelCase for function and variable names (e.g., `beforeLoad`, `afterSubmit`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `validateCustomerCreditLimit`).

## Script Design and Architecture

- **Only use the entry points relevant to the use case.**
- Organize the script into sections: entry points (beforeLoad, beforeSubmit, afterSubmit), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.

### Entry Point Definitions and Context
- `beforeLoad`: Executes before a record is loaded. Use this entry point to modify the form, add buttons, or set field values before the user interacts with the record.
- `beforeSubmit`: Executes before a record is submitted. Use this entry point to perform validation, set field values, or modify the record before it is saved to the database.
- `afterSubmit`: Executes after a record is submitted. Use this entry point to perform actions that require the record to be saved, such as creating related records, sending notifications, or performing asynchronous processing.

### Example User Event Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             UserEventScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             User Event Script description goes here...
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
         * @param {Request} context.request - The request object containing request information
         * @param {string} context.type - The type of operation (create, edit, view, copy)
         */
        beforeLoad: function ({ form, newRecord, request, type }) {
            // Entry point for beforeLoad
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.newRecord - The new record being submitted
         * @param {Record} context.oldRecord - The old record being submitted (only available for edit operations)
         * @param {string} context.type - The type of operation (create, edit, delete)
         */
        beforeSubmit: function ({ newRecord, oldRecord, type }) {
            // Entry point for beforeSubmit
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.newRecord - The new record that was submitted
         * @param {Record} context.oldRecord - The old record that was submitted (only available for edit operations)
         * @param {string} context.type - The type of operation (create, edit, delete)
         */
        afterSubmit: function ({ newRecord, oldRecord, type }) {
            // Entry point for afterSubmit
            // Delegate complex logic to helper functions
        }
    };
});
```

### Governance and Performance Optimization
- **User Event scripts have a governance limit of 1,000 points per execution.**
- If an operation in a User Event Script is expected to exceed the governance limit, consider offloading the processing to a Map/Reduce script and invoking it asynchronously from the User Event Script using `N/task` module.

## Deployment
- Deploy User Event Scripts to the appropriate record types and events based on the use case.
- Use the following XML structure to deploy the User Event Script in NetSuite using SDF:

```xml
<usereventscript scriptid="customscript_userevent_example">
    <name>User Event Example</name>
    <notifyowner>T</notifyowner>
    <scriptfile>[/SuiteScripts/UserEventScript.js]</scriptfile>
    <scriptcustomfields>
        <scriptcustomfield scriptid="custscript_ue_custom_field">
            <displaytype>NORMAL</displaytype>
            <fieldtype>TEXT</fieldtype>
            <ismandatory>F</ismandatory>
            <label>User Event Custom Field</label>
            <selectrecordtype>User Event Custom Field</selectrecordtype>
            <storevalue>T</storevalue>
        </scriptcustomfield>
    </scriptcustomfields>
   <scriptdeployments>
        <scriptdeployment scriptid="customdeploy_userevent_example">
            <isdeployed>T</isdeployed>
            <loglevel>DEBUG</loglevel>
            <recordtype>[customrecord_userevent_example]</recordtype>
            <status>TESTING</status>
            <title>User Event Example Deployment</title>
        </scriptdeployment>
    </scriptdeployments>
</usereventscript>
```

## User EventScript Example
- Refer to the sample User Event Script provided in the `./references` directory.

## User Event Script Best Practices
- Refer to the following page for recommended best practices and guidelines for User Event Script development in NetSuite: [User Event Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361453.html).
