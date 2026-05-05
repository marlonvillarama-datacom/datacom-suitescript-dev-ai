---
name: suitescript-client
description: Use this skill to design and develop Client Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Client Script Development

This skill provides best practices and guidelines for developing Client Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Client Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Client Scripts.
- Use the prefix `bex_cs_` for Client Script files (e.g., `bex_cs_salesorder.js`).
- Use camelCase for function and variable names (e.g., `pageInit`, `saveRecord`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `validateCustomerCreditLimit`).

## Script Design and Architecture

- **Only use the entry points relevant to the use case.** For example, if you only need to execute logic when a field changes, only implement the `fieldChanged` entry point and leave the others out of the script.
- Organize the script into sections: entry points (pageInit, saveRecord, validateField), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.
- Keep entry point functions concise and delegate complex logic to helper functions.

### Entry Point Definitions and Context
- `pageInit`: Executes when the form is initialized. Use this for setting default values, hiding/showing fields, or any setup logic needed when the form loads.
- `fieldChanged`: Executes when a field value changes. Use this for dynamic form behavior based on user input.
- `postSourcing`: Executes after a field that sources information from another record is changed. Use this for logic that depends on sourced field values.
- `validateField`: Executes when a field value is being changed, but before the change is applied. Use this to validate user input and return false to prevent the change if validation fails.
- `validateLine`: Executes when a sublist line is being changed, but before the change is applied. Use this to validate sublist line data and return false to prevent the change if validation fails.
- `validateInsert`: Executes when a new sublist line is being added, but before the line is inserted. Use this to validate new sublist line data and return false to prevent the insertion if validation fails.
- `validateDelete`: Executes when a sublist line is being deleted, but before the line is removed. Use this to validate the deletion and return false to prevent it if necessary.
- `sublistChanged`: Executes after a sublist line has been changed. Use this for logic that needs to run after a line is modified, added, or removed.
- `saveRecord`: Executes when the record is being saved, but before the save is completed. Use this to perform final validations or to set field values before the record is saved. Return false to prevent the save if validation fails.

### Entry Point Nuances to Always Consider

Client script event firing order — `pageInit` → `fieldChanged` → `postSourcing` → `sublistChanged`.
Know that `validateField`, `validateLine`, `validateInsert`, `validateDelete`, and `saveRecord` return boolean (true = proceed, false = block).

### Example Client Script structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             ClientScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Client Script description goes here...
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
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.mode - The mode in which the record is being accessed (view, edit, create)
         */
        pageInit: function ({ currentRecord, mode }) {
            // Entry point for pageInit
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the field is located
         * @param {string} context.fieldId - The field ID being validated
         * @param {number} context.line - The line number in the sublist (if applicable)
         * @param {number} context.column - The column number in the sublist (if applicable)
         */
        validateField: function ({ currentRecord, sublistId, fieldId, line, column }) {
            // Entry point for validateField
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the field is located
         * @param {string} context.fieldId - The field ID being changed
         * @param {number} context.line - The line number in the sublist (if applicable)
         * @param {number} context.column - The column number in the sublist (if applicable)
         */
        fieldChanged: function ({ currentRecord, sublistId, fieldId, line, column }) {
            // Entry point for fieldChanged
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the field is located
         * @param {string} context.fieldId - The field ID being sourced
         */
        postSourcing: function ({ currentRecord, sublistId, fieldId }) {
            // Entry point for postSourcing
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the line is located
         */
        validateLine: function ({ currentRecord, sublistId }) {
            // Entry point for validateLine
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the line is located
         * @param {number} context.line - The line number being inserted
         */
        validateInsert: function ({ currentRecord, sublistId, line }) {
            // Entry point for validateInsert
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the line is located
         * @param {number} context.line - The line number being deleted
         */
        validateDelete: function ({ currentRecord, sublistId, line }) {
            // Entry point for validateDelete
            // Delegate complex logic to helper functions
        },

        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         * @param {string} context.sublistId - The sublist ID where the line is located
         */
        sublistChanged: function ({ currentRecord, sublistId }) {
            // Entry point for sublistChanged
            // Delegate complex logic to helper functions
        },
        
        /**
         * @param {Object} context
         * @param {Record} context.currentRecord - The current record being viewed or edited
         */
        saveRecord: function ({ currentRecord }) {
            // Entry point for saveRecord
            // Delegate complex logic to helper functions
        }
    };
});
```

### Governance and Performance Optimization
- **Client scripts have a governance limit of 1,000 points per execution.** - Always be mindful of this limit when designing client script logic, especially when making server calls or performing record operations and searches.
- Minimize the number of server calls by using `currentRecord` APIs to access and manipulate record data on the client side.
- When server calls are necessary, use the native Javascript fetch APIs instead of the `N/https` module to make asynchronous calls to Suitelets or Restlets.

## Deployment
Use the following XML structure to deploy the Client Script in NetSuite using SDF:

```xml
<clientscript scriptid="customscript_clientscript_example">
    <isinactive>T</isinactive>
    <name>Client Script Example</name>
    <notifyowner>T</notifyowner>
    <scriptfile>[/SuiteScripts/ClientScriptExample.js]</scriptfile>
    <scriptcustomfields>
        <scriptcustomfield scriptid="custscript_client_custom_field">
            <displaytype>NORMAL</displaytype>
            <fieldtype>TEXT</fieldtype>
            <ismandatory>F</ismandatory>
            <label>Client Custom Field</label>
            <selectrecordtype>Client Custom Field</selectrecordtype>
            <storevalue>T</storevalue>
        </scriptcustomfield>
    </scriptcustomfields>
    <scriptdeployments>
        <scriptdeployment scriptid="customdeploy_clientscript_example">
            <recordtype>TASK</recordtype>
            <status>TESTING</status>
            <title>Client Script Example Deployment</title>
        </scriptdeployment>
    </scriptdeployments>
</clientscript>
```

## Best Practices
- Refer to the following page for recommended best practices and guidelines for Client Script development in NetSuite: [Client Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361924.html).
