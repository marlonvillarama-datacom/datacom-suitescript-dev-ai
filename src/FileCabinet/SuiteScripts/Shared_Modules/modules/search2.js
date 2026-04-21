/**
 * @NApiVersion         2.1
 * @NModuleScope        SameAccount
 * 
 * @description         Helper module for NetSuite search functions.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 04/03/2026           Marlon Villarama                    Project setup; initial version
 * 
 */

define(
    [
        'N/error',
        'N/search'
    ],
    (
        error,
        search
    ) => {
        const MODULE = `BEX.Search2`;

        class BEX_Search {
            searchObject;

            constructor(options) {
                let { id = '', type = '', filters = [], columns = [] } = options;
                if (!id && !type) {
                    throw error.create({ name: `${MODULE}.MISSING_SEARCH_ID_OR_TYPE`, details: 'The search ID or type is required.' });
                }

                if (id) {
                    this.searchObject = search.load({ id });
                    if (filters.length > 0) {
                        this.searchObject.filters.push('AND');
                        this.searchObject.filters.push(filters);
                    }

                    if (columns.length > 0) {
                        this.searchObject.columns = [
                            ...this.searchObject.columns,
                            ...columns
                        ];
                    }
                }
                else if (type) {
                    this.searchObject = search.create({ type });
                    if (filters.length > 0) {
                        this.searchObject.filters = filters;
                    }

                    if (columns.length > 0) {
                        this.searchObject.columns = columns;
                    }
                }
            }

            get columns() { return this.searchObject.columns }
            get columnLabels () {
                return this.searchObject.columns.map(c => {
                    return {
                        name: c.name,
                        label: c.label
                    }
                });
            }
            get expression() { return this.searchObject.filterExpression }
            get filters() { return this.searchObject.filters }

            addExpression(expression) {
                this.searchObject.filterExpression = this.searchObject.filterExpression.length > 0 ?
                    [
                        ...this.searchObject.filterExpression, 'AND',
                        expression
                    ] :
                    expression;
            }

            csv(options) {
                const TITLE = `${MODULE}.CSV`;
                let searchResults = this.raw();
                options = options || {};

                // let { save = false } = options;
                let textObject = options.text || {};
                let output = [];
                let columnKeys = {};
                let headerRow = [];

                this.searchObject.columns.forEach(c => {
                    let key = c.label || c.name;
                    columnKeys[key] = c;
                    headerRow.push(key);
                });
                if (headerRow.length > 0) {
                    output.push(headerRow);
                }

                searchResults.forEach(r => {
                    let row = [];
                    for (const [key, c] of Object.entries(columnKeys)) {
                        row.push(textObject.indexOf(key) >= 0 ?
                            (r.getText(c) || r.getValue(c)) :
                            r.getValue(c))
                    }
                    output.push(row);
                });

                // if (!save) {
                //     return { columns: this.columnLabels, data: output };
                // }

                // TODO Implement file save
                return { columns: this.columnLabels, data: output };
            }

            json(options) {
                const TITLE = `${MODULE}.Json`;
                let searchResults = this.raw();
                options = options || {};
                
                // let { save = false, text } = options;
                let textObject = options.text || {};
                let output = [];

                searchResults.forEach(r => {
                    let row = { id: r.getValue('internalid') || r.id };
                    this.columns.forEach(c => {
                        let key = c.label || c.name;
                        row[key] = textObject.indexOf(key) >= 0 ?
                            (r.getText(c) || r.getValue(c)) :
                            r.getValue(c)                        
                    });
                    output.push(row);
                });

                // if (!save) {
                //     return { columns: this.columnLabels, data: output };
                // }

                // TODO Implement file save
                return { columns: this.columnLabels, data: output };
            }

            raw() {
                const TITLE = `${MODULE}.Raw`;
                const STEP = 1000;
                let start = 0;
                let end = STEP;
                let results = [];
                let output = [];

                // log.debug({ title: `${TITLE} filters`, details: this.searchObject.filterExpression });
                // log.debug({ title: `${TITLE} columns`, details: this.searchObject.columns });

                do {
                    results = this.searchObject.run().getRange({ start, end });
                    output = [ ...output, ...results ];
                    start += STEP;
                    end += STEP;
                } while (results.length >= STEP);

                // log.debug({ title: `${TITLE} output`, details: output });
                return output;
            }
        }

        return {
            init: (options) => {
                const TITLE = `${MODULE}.Init`;

                if (!options) {
                    throw error.create({ name: `${MODULE}.MISSING_SEARCH_ID_OR_TYPE`, details: 'The search ID or type is required.' });
                }

                let { id = '', type = '', filters = [], columns = [] } = options;
                return new BEX_Search({ id, type, filters, columns });
            }
        };
    }
);