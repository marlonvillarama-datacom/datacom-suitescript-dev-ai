---
name: suitescript-restlet
description: Use this skill to design and develop Restlet Scripts in NetSuite using SuiteScript, following best practices and guidelines for coding conventions, architecture, and performance optimization.
---

# SuiteScript Restlet Script Development

This skill provides best practices and guidelines for developing Restlet Scripts in NetSuite using SuiteScript. It covers coding conventions, architecture guidelines, and performance optimization techniques to help developers create efficient and maintainable Restlet Scripts.

## Naming Conventions

- Use only SuiteScript 2.1 API for Restlet Scripts.
- Use the prefix `bex_rl_` for Restlet Script files (e.g., `rl_salesorder.js`).
- Use camelCase for function and variable names (e.g., `get`, `post`).
- Use descriptive names that indicate the purpose of the function or variable (e.g., `getCustomerData`).

## Script Design and Architecture
- Organize the script into sections: entry points (get, post, put, delete), helper functions, and utility functions.
- Use comments to explain the purpose of each section and important logic.

### Governance and Performance Optimization
- **Restlets have a governance limit of 5,000 points per execution.**
- The maximum size of a RESTlet string response is 10MB. If more data needs to be returned, consider paginating the response or implementing a different design approach, such as having the RESTlet write the data to a file and return a link to the file instead.

## Restlet Script Structure

```javascript
/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.x
 * @NModuleScope            SameAccount
 * @NScriptType             Restlet
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Restlet description goes here...
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * <today>              <your_name>                         Initial version
 *
 */
 
define(['N/log', 'N/record'], function(log, record) {

    // Helper functions for complex logic can be defined here

    return {
        get: function (context) {
            // Entry point for GET requests
            // Delegate complex logic to helper functions
        },
        post: function (context) {
            // Entry point for POST requests
            // Delegate complex logic to helper functions
        },
        put: function (context) {
            // Entry point for PUT requests
            // Delegate complex logic to helper functions
        },
        delete: function (context) {
            // Entry point for DELETE requests
            // Delegate complex logic to helper functions
        }
    };
});
```

## Design Considerations
- Front-end Suitelets should only implement GET requests to render forms and display data. For any data processing or manipulation, create a corresponding back-end Suitelet that handles POST requests.
- When large datasets are involved, implement pagination or lazy loading techniques to improve performance and user experience.
- Create a corresponding client script file to handle client-side interactions, validations, and button actions.
- Default action buttons should trigger async POST requests to a back-end Suitelet for processing. A spinner should be displayed while waiting for the response from the back-end Suitelet to enhance user experience.
- When submitting large amount of data from the front-end Suitelet to the back-end Suitelet, consider any one  of the following design options:
  - Allow the backend Suitelet to only process one record at a time. Submit multiple concurrent async requests to the backend Suitelet and manage all Promise objects within the client script.
  - Implement a queue system in the backend Suitelet to manage incoming requests and process them sequentially. The client script can submit all records at once, and the backend Suitelet will handle them one by one, ensuring that the system is not overwhelmed with concurrent requests.
  - Create a scheduled script or map/reduce that runs at regular intervals to process records in batches. The front-end Suitelet can submit all records to a custom record type, and the scheduled script will pick up those records and process them in batches, ensuring efficient handling of large volumes of data.
- Implement error handling and logging to facilitate debugging and maintenance of the Suitelet Script.
- When creating forms, sublists, and fields, use the functions from `/src/FileCabinet/SuiteScripts/Shared_Modules/ui.js` module first, then the `N/ui/serverWidget` module if no suitable function is available.

## Design Considerations (Back-end Suitelets)
- Backend Suitelets should only implement POST requests to handle data processing and manipulation. They should not render any forms or display data directly to the user. Instead, they should return responses in JSON format to be consumed by the requestors.
- Focus on efficient data processing and ensure that the script can handle large volumes of data without performance degradation.
- Implement error handling and logging to facilitate debugging and maintenance of the Suitelet Script.

## Restlet Script Best Practices
- Refer to the following page for recommended best practices and guidelines for Restlet Script development in NetSuite: [Suitelet Script Best Practices](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3361453.html).
