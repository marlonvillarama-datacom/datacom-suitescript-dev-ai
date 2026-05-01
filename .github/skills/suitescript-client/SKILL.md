---
name: suitescript-user-event
description: Use this skill to design and develop Client Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Client Script Development

This skill provides best practices and guidelines for developing Client Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Client Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Client Scripts.
- Use the prefix `bex_cs_` for Client Script files (e.g., `cs_salesorder.js`).
- Use camelCase for function and variable names (e.g., `pageInit`, `saveRecord`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `validateCustomerCreditLimit`).

## Script Design and Architecture

- Organize the script into sections: entry points (pageInit, saveRecord, validateField), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.
- Keep entry point functions concise and delegate complex logic to helper functions.

### Entry Point Nuances to Always Consider

Client script event firing order — `pageInit` → `fieldChanged` → `postSourcing` → `sublistChanged`.
Know that `validateField`, `validateLine`, `validateInsert`, `validateDelete`, and `saveRecord` return boolean (true = proceed, false = block).

### Governance and Performance Optimization
- **Client scripts have a governance limit of 1,000 points per execution.** - Always be mindful of this limit when designing client script logic, especially when making server calls or performing record operations and searches.
- Minimize the number of server calls by using `currentRecord` APIs to access and manipulate record data on the client side.
- When server calls are necessary, use the native Javascript fetch APIs instead of the `N/https` module to make asynchronous calls to Suitelets or Restlets.

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

define(['N/log', 'N/record'], function(log, record) {

    // Helper functions for complex logic can be defined here

    return {
        pageInit: function ({ currentRecord, mode }) {
            // Entry point for pageInit
            // Delegate complex logic to helper functions
        },
        validateField: function ({ currentRecord, sublistId, fieldId, line, column }) {
            // Entry point for validateField
            // Delegate complex logic to helper functions
        },
        fieldChanged: function ({ currentRecord, sublistId, fieldId, line, column }) {
            // Entry point for fieldChanged
            // Delegate complex logic to helper functions
        },
        postSourcing: function ({ currentRecord, sublistId, fieldId }) {
            // Entry point for postSourcing
            // Delegate complex logic to helper functions
        },
        validateLine: function ({ currentRecord, sublistId }) {
            // Entry point for validateLine
            // Delegate complex logic to helper functions
        },
        validateInsert: function ({ currentRecord, sublistId, line }) {
            // Entry point for validateInsert
            // Delegate complex logic to helper functions
        },
        validateDelete: function ({ currentRecord, sublistId, line }) {
            // Entry point for validateDelete
            // Delegate complex logic to helper functions
        },
        sublistChanged: function ({ currentRecord, sublistId }) {
            // Entry point for sublistChanged
            // Delegate complex logic to helper functions
        },
        saveRecord: function ({ currentRecord }) {
            // Entry point for saveRecord
            // Delegate complex logic to helper functions
        }
    };
});
```

## User Event Script Example
- Refer to the sample User Event Script provided in the `./references` directory.

## User Event Script Best Practices
- Refer to the following page for recommended best practices and guidelines for User Event Script development in NetSuite: [Client Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361924.html).
