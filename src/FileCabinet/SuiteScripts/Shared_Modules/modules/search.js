/**
 * @NApiVersion         2.1
 * @NModuleScope        SameAccount
 * 
 * @description         Helper module for NetSuite search functions.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 18/11/2025           Marlon Villarama                    Project setup; initial version
 * 
 */

define(
    [
        'N/search'
    ],
    (
        search
    ) => {
        const MODULE = `BEX.Search`;

        class BEX_Search {
            searchObject;

            constructor({ searchObject }) {
                this.searchObject = searchObject;
            }

            get object() { return this.searchObject; }
            get columns() { return this.searchObject.columns; }
            get filters() { return this.searchObject.filters; }
            get expression() { return this.searchObject.filterExpression; }

            addExpression(exp) {
                this.searchObject.filterExpression = this.searchObject.filterExpression.length > 0 ?
                    [
                        ...this.searchObject.filterExpression, 'AND',
                        exp
                    ] :
                    exp;
            }

            getJson(options) {
                const TITLE = `${MODULE}.GetJson`;
                let searchResults = this.getRaw();
                let output = [];
                let text = !!options === true ? options.text : false;

                searchResults.forEach(r => {
                    let row = { id: r.getValue('internalid') || r.id };
                    // let row = {};
                    (this.columns || []).forEach(c => row[c.label || c.name] = !!text === true ?
                        (r.getText(c) || r.getValue(c)) : r.getValue(c));
                    output.push(row);
                });

                return output;
            }

            getRaw() {
                const TITLE = `${MODULE}.GetRaw`;
                const STEP = 1000;
                let start = 0;
                let end = STEP;
                let results = [];
                let output = [];

                log.debug({ title: `${TITLE} filters`, details: this.searchObject.expression });
                log.debug({ title: `${TITLE} columns`, details: this.searchObject.columns });

                do {
                    results = this.searchObject.run().getRange({ start, end });
                    output = [ ...output, ...results ];
                    start += STEP;
                    end += STEP;
                } while (results.length >= STEP);

                log.debug({ title: `${TITLE} output`, details: output });
                return output;
            }
        }

        return {
            /**
             * Returns an instance of the Datacom search object.
             * 
             * Example usage:
             * let scriptParams = params.read({
             *      map: {
             *          firstParam: 'custscript_param_id_1
             *          secondParam: 'custscript_param_id_2
             *      }
             * });
             * 
             * Output:
             * {
             *      firstParam: <value of custscript_param_id_1>,
             *      secondParam: <value of custscript_param_id_2>
             * }
             * 
             * @param {Object} map - Object with key/value pairs of script parameter identifiers and script IDs 
             * @returns {Object} Object containing key/value pairs of script parameter identifiers and their values.
             */
            create: ({ type, filters, columns }) => {
                return new BEX_Search({
                    searchObject: search.create({ type, filters, columns })
                })
            },

            createColumn: (options) => {
                return search.createColumn(options);
            },

            init: (options) => {
                const TITLE = `${MODULE}.Init`;
                if (!options) {
                    throw error.create({ name: `${MODULE}.MISSING_SEARCH_ID_OR_TYPE`, details: 'The search ID or type is required.' });
                }

                let { id = '', type = '', filters = [], columns = [] } = options;
                // let searchObject = id ? search.load({ id }) : search.create({ type, filters, columns });
                return new BEX_Search({ searchObject: id ? search.load({ id }) : search.create({ type, filters, columns }) });
            },

            load: ({ id, filters }) => {
                let searchObject = new BEX_Search({ searchObject: search.load({ id }) });
                if (filters) { searchObject.addExpression(filters) };

                return searchObject;
            },

            lookup: ({ id, type, columns }) => {
                const TITLE = `${MODULE}.Lookup`;
                let recordLookup = search.lookupFields({ id, type, columns });
                log.debug({ title: `${TITLE}.Lookup recordLookup`, details: recordLookup });
                let output = {};

                for (const [k, v] of Object.entries(recordLookup)) {
                    output[k] = v;
                    
                    if (Array.isArray(v) && v.length > 0) {
                        output[k] = v[0].value;
                    }
                }

                log.debug({ title: TITLE, details: output });
                return output;
            },

            getJSON: ({ id, filters }) => {
                let searchObject = new BEX_Search({ searchObject: search.load({ id, filters }) });
                if (filters) { searchObject.addExpression(filters) };

                return searchObject.getJson();
            }
        };
    }
);