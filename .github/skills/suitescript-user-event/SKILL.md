---
name: suitescript-user-event
description: Use this skill to design and develop User Event Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript User Event Script Development

This skill provides best practices and guidelines for developing User Event Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable User Event Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for User Event Scripts.
- Use the prefix `bex_ue_` for User Event Script files (e.g., `ue_salesorder.js`).
- Use camelCase for function and variable names (e.g., `beforeLoad`, `afterSubmit`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `validateCustomerCreditLimit`).

## Script Design and Architecture
- Organize the script into sections: entry points (beforeLoad, beforeSubmit, afterSubmit), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.

### Governance and Performance Optimization
- **User Event scripts have a governance limit of 1,000 points per execution.**
- If an operation in a User Event Script is expected to exceed the governance limit, consider offloading the processing to a Map/Reduce script and invoking it asynchronously from the User Event Script using `N/task` module.

### User Event Script Structure

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

define(['N/log', 'N/record'], function(log, record) {

    // Helper functions for complex logic can be defined here

    return {
        beforeLoad: function ({ form, newRecord, request, type }) {
            // Entry point for beforeLoad
            // Delegate complex logic to helper functions
        },

        beforeSubmit: function ({ newRecord, oldRecord, type }) {
            // Entry point for beforeSubmit
            // Delegate complex logic to helper functions
        },

        afterSubmit: function ({ newRecord, oldRecord, type }) {
            // Entry point for afterSubmit
            // Delegate complex logic to helper functions
        }
    };
});
```

## User Event Script Example
- Refer to the sample User Event Script provided in the `./references` directory.

## User Event Script Best Practices
- Refer to the following page for recommended best practices and guidelines for User Event Script development in NetSuite: [User Event Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361453.html).
