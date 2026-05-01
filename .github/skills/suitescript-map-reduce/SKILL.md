---
name: suitescript-map-reduce
description: Use this skill to design and develop Map/Reduce Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Map/Reduce Script Development

This skill provides best practices and guidelines for developing Map/Reduce Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Map/Reduce Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Map/Reduce Scripts.
- Use the prefix `bex_mr_` for Map/Reduce Script files (e.g., `mr_salesorder.js`).
- Use camelCase for function and variable names (e.g., `getInputData`, `map`, `reduce`, `summarize`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `processCustomerOrders`).

## Script Design and Architecture
- Organize the script into sections: entry points (getInputData, map, reduce, summarize), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.
- Keep entry point functions concise and delegate complex logic to helper functions.

### Governance and Performance Optimization
- Always be mindful of the following governance limits for each map/reduce stage:
    - getInputData: 10,000 API usage points
    - map: 1,000 API usage points per execution
    - reduce: 5,000 API usage points per execution
    - summarize: 10,000 API usage points

## Map/Reduce Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             MapReduceScript
 */
define(['N/log', 'N/record'], function(log, record) {

    // Helper functions for complex logic can be defined here

    return {
        getInputData: function () {
            // Entry point for getInputData
            // Delegate complex logic to helper functions
        },

        map: function (context) {
            let { key, value } = context;
            // Entry point for map
            // Delegate complex logic to helper functions
        },

        reduce: function (context) {
            let { key, values } = context;
            // Entry point for reduce
            // Delegate complex logic to helper functions
        },

        summarize: function ({ mapSummary, reduceSummary, output, errors }) {
            // Entry point for summarize
            // Delegate complex logic to helper functions
        }
    };
});
```

## Map/Reduce Script Example
- Refer to the sample Map/Reduce Script provided in the `./references` directory.

## Map/Reduce Script Best Practices
- Refer to the following page for recommended best practices and guidelines for Map/Reduce Script development in NetSuite: [Map/Reduce Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0801064715.html).
