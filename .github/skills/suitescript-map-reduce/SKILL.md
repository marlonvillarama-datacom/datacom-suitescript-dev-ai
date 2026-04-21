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

## Script Structure
- Organize the script into sections: entry points (getInputData, map, reduce, summarize), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.
- Keep entry point functions concise and delegate complex logic to helper functions.

## Map/Reduce Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             MapReduceScript
 */
define(['N/log', 'N/record'], function(log, record) {

    function getInputData(context) {
        // Entry point for getInputData
        // Delegate complex logic to helper functions
        handleGetInputData(context);
    }

    function map(context) {
        // Entry point for map
        // Delegate complex logic to helper functions
        handleMap(context);
    }

    function reduce(context) {
        // Entry point for reduce
        // Delegate complex logic to helper functions
        handleReduce(context);
    }

    function summarize(context) {
        // Entry point for summarize
        // Delegate complex logic to helper functions
        handleSummarize(context);
    }

    // Helper functions for each entry point
    function handleGetInputData(context) {
        // Complex logic for getInputData
    }

    function handleMap(context) {
        // Complex logic for map
    }

    function handleReduce(context) {
        // Complex logic for reduce
    }

    function handleSummarize(context) {
        // Complex logic for summarize
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
```

## Map/Reduce Script Example
- Refer to the sample Map/Reduce Script provided in the `./references` directory.

## Map/Reduce Script Best Practices
- Refer to the following page for recommended best practices and guidelines for Map/Reduce Script development in NetSuite: [Map/Reduce Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0801064715.html).
