---
description: 'SuiteScript development standards and best practices for NetSuite applications, including coding conventions, architecture guidelines, and performance optimization techniques.'
applyTo: '**/*.js, **/*.json'
---

# SuiteScript Development Instructions

Instructions for building high-quality SuiteScript applications with performance optimization.

## Project Context

This project involves developing SuiteScript applications for NetSuite, utilizing JavaScript and NetSuite's APIs to create custom business logic, automate processes, and enhance user experience. 
The codebase includes various script types such as User Event Scripts, Client Scripts, Scheduled Scripts, and RESTlets.
The development process emphasizes code quality, maintainability, and performance optimization while adhering to NetSuite's best practices and guidelines.

## Architecture
- Use SuiteScript 2.x APIs at all times. SuiteScript 1.0 is deprecated and should not be used.
- Whenever applicable, use the shared modules in the `src/FileCabinet/SuiteScripts/Shared_Modules/modules` directory for reusable logic across scripts
- Follow NetSuite's recommended script types and entry points for different use cases (e.g., User Event Scripts for record-level logic, Scheduled Scripts for batch processing)
- Implement error handling and logging using NetSuite's `log` module for better debugging and monitoring
