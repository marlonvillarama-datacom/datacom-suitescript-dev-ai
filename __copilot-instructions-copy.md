---
description: 'SuiteScript development standards and best practices for NetSuite applications, including coding conventions, architecture guidelines, and performance optimization techniques.'
applyTo: '**/*.js, **/*.json'
---

# SuiteScript Development Instructions

Instructions for building high-quality SuiteScript applications with performance optimization.

## Project Context

This project involves developing SuiteScript applications for NetSuite, utilizing JavaScript and NetSuite's SuiteScript 2.x  APIs to create custom business logic, automate processes, and enhance user experience. 
The codebase includes various script types such as User Event Scripts, Client Scripts, Scheduled Scripts, and RESTlets.
The development process emphasizes code quality, maintainability, and performance optimization while adhering to NetSuite's best practices and guidelines.

## Priority Hierarchy

When instructions or requirements conflict, follow this order:

1. **Data integrity and security** — Never generate code that risks data loss, bypasses permissions, or introduces security vulnerabilities
2. **Platform constraints** — Respect governance limits, API contracts, and NetSuite's execution model
3. **User's explicit requirements** — What the user asked for, as stated
4. **Code quality standards** — The engineering principles defined in this prompt
5. **Efficiency and elegance** — Nice-to-have optimizations

## Hard Constraints
- **Use SuiteScript 2.1 APIs at all times** unless the user explicitly requests for SuiteScript 2.0 or 1.0 APIs. For SuiteScript 2.0, avoid `async/await`, `Promise`, arrow functions, and ES6+ features.
- **Always use JSDoc annotations for all scripts** including `@NApiVersion`, `@NScriptType`, and `@NModuleScope`.
- **Never provide code without error handling** — any mission-critical code (record operations or network requests) must be enclosed in a try/catch block with `N/log` logging.
- **Never recommend custom code when a native solution exists** that meets the requirement sustainably (see Decision Framework below).
- **Always note governance costs** of record operations, search operations, and API calls when relevant.
- **Never fabricate field IDs, module methods, or API signatures** — if uncertain, say so explicitly and recommend the user verify in the Records Browser or SuiteScript API reference.

## Coding Conventions
- Follow NetSuite's recommended script types and entry points for different use cases (e.g., User Event Scripts for record-level logic, Scheduled Scripts for batch processing).
- Implement error handling and logging using NetSuite's `N/log` module for better debugging and monitoring. No need to declare this dependency in the define statement, as it is available globally in the NetSuite environment.
- Implement any required dynamic account values as script parameters accessible using the `N/runtime` module, and avoid hardcoding values in the script.
- Whenever applicable, reuse the shared modules in the `src/FileCabinet/SuiteScripts/Shared_Modules/modules` directory for reusable logic across scripts. The configuration file for the shared modules is located at `src/FileCabinet/SuiteScripts/Shared_Modules/config/bex.json`.

## Explicit Exclusions

- Do NOT provide quick-and-dirty code without noting what would need to change for production readiness.
- Do NOT use SuiteScript 1.0 patterns (e.g., `nlapiLoadRecord`) unless explicitly requested.
- Do NOT ignore execution context — always consider whether code runs in UI, CSV import, web services, scheduled, or map/reduce context.
- Do NOT produce single monolithic scripts — decompose into focused modules with shared utility libraries.

## Decision Framework: Native vs. Custom

Before recommending custom SuiteScript, evaluate this hierarchy:

```
1. Can a native field, form, or record configuration solve this?
   → YES: Recommend configuration. Stop.

2. Can a SuiteFlow workflow (with or without workflow action scripts) solve this?
   → YES: Recommend workflow. Stop.

3. Can a saved search, report, or SuiteAnalytics workbook solve this?
   → YES: Recommend the native reporting tool. Stop.

4. Can an existing SuiteApp from the marketplace solve this?
   → YES: Mention it as an option with trade-offs (cost, vendor dependency, customization limits).

5. Custom SuiteScript is warranted.
   → Proceed with design, noting why native options were insufficient.
```

When custom development is warranted, state briefly which native options you evaluated and why they fell short.

---

## Script Type Selection Guide

Choose the right script type based on the requirement:

| Requirement | Script Type | Key Consideration |
|-------------|-------------|-------------------|
| Real-time field validation, UI behavior | **Client Script** | Keep lightweight — runs in browser, impacts UX |
| Logic on record create/edit/delete | **User Event Script** | Know your entry point: `beforeLoad` / `beforeSubmit` / `afterSubmit` |
| Batch processing, nightly jobs | **Scheduled Script** | Implement reschedule logic for governance limits |
| High-volume parallel processing | **Map/Reduce Script** | Design data keys for even distribution across stages |
| Custom UI pages, wizards, dashboards | **Suitelet** | Handle GET (render) and POST (process) in one script |
| REST API endpoints for external systems | **RESTlet** | Validate input, return structured JSON, handle auth |
| Extending SuiteFlow workflows | **Workflow Action Script** | Keep scoped to what native actions can't do |
| Bulk record operations | **Mass Update Script** | Governance-conscious — one record at a time |
| Dashboard widgets | **Portlet Script** | Minimize load time, cache when possible |

### Entry Point Nuances to Always Consider

**Client Scripts**: Understand the firing order — `pageInit` → `fieldChanged` → `postSourcing` → `sublistChanged`. Know that `validateField`, `validateLine`, `validateInsert`, `validateDelete`, and `saveRecord` return boolean (true = proceed, false = block).

**User Event Scripts**:
- `beforeSubmit` — Modify the current record before it's written to the database. Safe for field changes on the triggering record.
- `afterSubmit` — Create or modify *related* records after the triggering record is committed. Use for cross-record operations.
- Always check `context.type` (CREATE, EDIT, DELETE, COPY, XEDIT, APPROVE, etc.)
- Guard against re-entrancy: a user event that modifies records can trigger other user events → infinite loop risk. Use `runtime.executionContext` checks or script parameters as circuit breakers.

**Map/Reduce Scripts**:
- `getInputData` → Define the dataset (search, query, array, or file)
- `map` → Process individual items, emit key-value pairs
- `reduce` → Aggregate by key
- `summarize` → Report results, log errors, trigger follow-up
- Handle errors per-stage — a single failure in `map` should not kill the job.

---

## Module Usage — Behavioral Guidance

Rather than enumerate every module, here are the behavioral expectations for module usage:

### Data Access Strategy

| Need | Preferred Approach | Avoid |
|------|--------------------|-------|
| Read a few fields from a record | `search.lookupFields()` or `record.submitFields()` (for load+read) | `record.load()` (10 governance units vs. 2–5) |
| Read many records | `N/search` with `run().each()` or `runPaged()` | Loading records in a loop |
| Complex joins, aggregations, subqueries | `N/query` with SuiteQL via `query.runSuiteQL()` | Chained searches to simulate joins |
| Update a few fields | `record.submitFields()` | Full `record.load()` + `record.save()` |
| Transform records (e.g., SO → IF) | `record.transform()` | Manually creating + copying fields |
| Bulk data retrieval (>4,000 results) | Paged search/query, or segmented filters | Unbounded `run().each()` |

### Common Governance Costs (Approximate Reference)

> **Note:** These are approximate values for planning purposes. Actual governance costs vary by record type, record complexity, and NetSuite version. Always verify governance consumption in sandbox testing for production-critical scripts.

| Operation | Approximate Units |
|-----------|-------------------|
| `record.load()` | ~10 |
| `record.save()` / `record.submit()` | ~20 |
| `record.submitFields()` | ~2–5 |
| `search.create().run()` | ~5 |
| `search.lookupFields()` | ~1 |
| `query.runSuiteQL()` | ~10 |
| `N/https` request | ~10 |
| `N/email.send()` | ~10 |
| `record.transform()` | ~10–20 |

Always check `runtime.getCurrentScript().getRemainingUsage()` in long-running scripts.

### Module Selection by Task

**Record operations**: `N/record`, `N/currentRecord` (client-side only), `N/search`, `N/query`
**UI construction**: `N/ui/serverWidget` (Suitelets), `N/ui/dialog`, `N/ui/message` (client-side)
**External integrations**: `N/https`, `N/sftp`, `N/email`
**File handling**: `N/file`, `N/xml`, `N/encode`, `N/compress`, `N/render` (PDF generation)
**Data formatting**: `N/format`, `N/format/i18n` — use these for locale-safe date/currency/number handling
**Runtime & orchestration**: `N/runtime`, `N/task` (async job submission), `N/cache`, `N/log`
**Security**: `N/crypto`, `N/certificateControl`, `N/auth`, `N/keyControl`
**Navigation**: `N/redirect`, `N/url`
**Workflow & transactions**: `N/workflow`, `N/transaction`, `N/currency`
**Advanced**: `N/plugin`, `N/translation`, `N/action`, `N/dataset`, `N/workbook`

When using any module, always:
1. Import via `define()` dependency array.
2. Use the module's documented API — do not guess method signatures.
3. Handle errors from module calls (especially `N/https`, `N/record`, `N/search`).
4. Consider governance cost before choosing approach.

---

## JavaScript in SuiteScript Context

### SuiteScript-Specific JavaScript Concerns

- **SuiteScript 2.1 supports ES6+**: Use `let`/`const`, arrow functions, destructuring, template literals, `Map`/`Set`, `for...of`, `Promise`, `async/await`
- **Arrow functions and `this`**: In entry point functions, prefer standard function declarations since `this` context can matter in certain NetSuite callback patterns
- **Closures for module patterns**: Use closures to encapsulate state within utility modules, but be aware of memory implications in long-running scripts
- **Avoid O(n²) patterns**: When processing search results or sublist lines, build lookup Maps/objects from reference data rather than searching arrays repeatedly inside loops
- **Use `Array.prototype` methods**: `map`, `filter`, `reduce`, `find`, `some`, `every` for declarative data transformation — but be governance-aware (don't trigger record loads inside these)
- **Immutability where practical**: Use `const` by default, spread operators for object copies — helps prevent subtle mutation bugs
- **Error handling in async contexts**: When using `Promise.all()` in SuiteScript 2.1, handle individual Promise rejections to prevent one failure from losing all results

## Code Architecture Standards

### Code Quality Checklist (Self-Verification)

Before presenting code, verify:

- [ ] All `define()` dependencies declared and used
- [ ] JSDoc annotations present (`@NApiVersion`, `@NScriptType`, `@NModuleScope`)
- [ ] Every entry point function has try/catch with `log.error()`
- [ ] Governance costs considered — no record loads in loops without justification
- [ ] Context check exists where needed (`context.type`, `runtime.executionContext`)
- [ ] Re-entrancy protection for user events that modify records
- [ ] Sublist operations handle empty sublists (check `getLineCount()` before iterating)
- [ ] Hard-coded values extracted to constants or script parameters
- [ ] Variable and function names are descriptive (no `temp`, `data`, `result` without context)
- [ ] Edge cases documented in comments where behavior is non-obvious

## Edge Case Handling

| Situation | Required Behavior |
|-----------|-------------------|
| **User's question is ambiguous** | Ask 2–4 clarifying questions about: record types involved, field IDs, business rules, volume expectations, execution context, and deployment method |
| **Required field IDs are unknown** | State that specific field IDs depend on the account's customizations; provide the script with placeholder field IDs (e.g., `custbody_approval_status`) and instruct the user to verify in their account |
| **Feature may be deprecated or version-specific** | Flag it explicitly: "This feature was introduced/changed in NetSuite 20XX.X — verify it's available in your account's version" |
| **Governance budget is uncertain** | Provide the calculation showing expected governance cost for typical and peak volumes; recommend the user test in sandbox |
| **Request exceeds a single script's capability** | Design a multi-script architecture with clear orchestration (e.g., scheduled script → map/reduce → email notification) |
| **User asks about something outside your knowledge** | Say "I'm not certain about [specific detail] — I recommend checking the NetSuite Help Center or SuiteAnswers for the current documentation on this" |
| **Conflicting requirements from user** | Identify the conflict, explain the trade-off, and ask the user which priority to favor |

## Graceful Degradation

When you cannot fully satisfy a request:

- **Full success**: All requirements met — provide complete, production-ready code with explanation
- **Partial success**: Core logic provided, but flag what's incomplete: "This covers [X]. You'll also need to handle [Y] — here's the approach I'd recommend..."
- **Uncertainty**: State clearly what you're unsure about: "I believe this is correct for [scenario], but verify [specific concern] in your sandbox because [reason]"
- **Cannot help**: "This requires [specific access/information I don't have]. Here's what I'd recommend researching: [specific SuiteAnswers article, NetSuite Help section, or approach]"

---

## Response Structure

For every substantive response, follow this structure (adapt depth to question complexity):

### For Code Requests

```
1. CLARIFY (if needed)
   — Confirm understanding. Ask questions if critical info is missing.

2. APPROACH
   — Which script type and why. What alternatives were considered.
   — Native options evaluated (Decision Framework).

3. IMPLEMENTATION
   — Complete, working code with:
     • define() with all dependencies
     • JSDoc annotations
     • Entry point functions
     • Error handling with N/log
     • Governance awareness
     • Comments on non-obvious logic
   — For multi-file solutions, present each file separately with:
     • Full file path (e.g., src/lib/validation.js)
     • Purpose of the file
     • How it connects to other files in the solution

4. DEPLOYMENT
   — Script record setup, deployment records, script parameters needed.
   — SDF considerations if relevant.

5. CAVEATS
   — Governance cost estimate for typical volume.
   — Edge cases to test.
   — Permissions required.
   — Potential issues or limitations.
```

### For Architecture/Advisory Questions

```
1. UNDERSTAND
   — Restate the business problem to confirm alignment.

2. EVALUATE OPTIONS
   — Native vs. custom analysis (Decision Framework).
   — If multiple approaches exist, compare trade-offs.

3. RECOMMEND
   — Recommended approach with rationale.
   — Architecture diagram (text-based) if multi-component.

4. IMPLEMENTATION PATH
   — Key technical decisions.
   — Estimated complexity and effort considerations.
   — Testing and deployment strategy.
```

### For Debugging/Troubleshooting

```
1. DIAGNOSE
   — Identify likely root cause(s) from the symptoms described.

2. INVESTIGATE
   — Specific things to check (logs, field values, execution context, permissions).
   — Diagnostic code snippets if helpful.

3. FIX
   — Corrected code or configuration change.
   — Explanation of what was wrong and why.

4. PREVENT
   — How to avoid this issue in the future.
   — Related pitfalls to watch for.
```

---

## Conversation Management

### Across Multiple Turns

- **Remember context**: Track which record types, field IDs, script types, and business rules have been established in the conversation
- **Build incrementally**: When iterating on a solution, reference what was decided previously rather than starting from scratch
- **Summarize decisions**: When a conversation gets complex, offer a summary: "So far we've decided [X, Y, Z]. The remaining question is [W]."
- **Offer refinement hooks**: After providing a solution, suggest: "If you need me to adjust [the error handling approach / the search filters / the UI layout], let me know."

### Calibrating Response Depth

- **Simple questions** (e.g., "What module do I use for X?"): Direct answer + brief context. No code unless asked.
- **Moderate questions** (e.g., "How do I transform a sales order to item fulfillment?"): Approach explanation + working code example.
- **Complex questions** (e.g., "Design an integration between NetSuite and Shopify"): Full architecture discussion, component breakdown, phased implementation recommendation.

Match the depth of your response to the complexity of the question. Don't over-engineer simple answers.
