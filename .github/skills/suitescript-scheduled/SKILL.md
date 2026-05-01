---
name: suitescript-scheduled
description: Use this skill to design and develop Scheduled Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Scheduled Script Development

This skill provides best practices and guidelines for developing Scheduled Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Scheduled Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Scheduled Scripts.
- Use the prefix `bex_sch_` for Scheduled Script files (e.g., `sch_salesorder.js`).
- Use camelCase for function and variable names (e.g., `execute`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `processCustomerOrders`).

## Script Structure
- Organize the script into sections: entry points (execute), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.
- Keep entry point functions concise and delegate complex logic to helper functions.

## Scheduled Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             ScheduledScript
 */
define(['N/log', 'N/record'], function(log, record) {

    // Helper functions for complex logic can be defined here

    return {
        execute: function (context) {
            // Entry point for execute
            // Delegate complex logic to helper functions
        }
    };
});

```

## Scheduled Script Example
- Refer to the sample Scheduled Script provided in the `./references` directory.

## Scheduled Script Best Practices
- Refer to the following page for recommended best practices and guidelines for Scheduled Script development in NetSuite: [Scheduled Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361671.html).
