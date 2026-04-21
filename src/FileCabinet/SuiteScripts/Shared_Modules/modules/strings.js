/**
 * @NApiVersion         2.1
 * @NModuleScope        SameAccount
 * 
 * @description         Helper module for string functions.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 19/11/2025           Marlon Villarama                    Initial version
 * 
 */

define(
    [],
    () => {
        const MODULE = `BEX.Strings`;

        return {
            /**
             * Converts a multi-line string into an array of strings.
             * 
             * @param {string} value - The input multi-line string to be parsed. 
             * @returns {Array}
             */
            multiLineToArray: (value) => {
                let result = [];

                let rows = value.split('\r\n');
                rows.forEach(row => {
                    result = [ ...result, ...row.split(',').map(r => r.trim()) ]
                });

                return [ ...new Set(result) ];
            },

            /**
             * Converts a string into lower-case and converts any whitespaces into underlines ('_').
             * 
             * @param {number} [length=10] - The length of the random string to be generated. 
             * @returns {string}
             */
            random: (length = 10) => {
                let result = '';
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                const charactersLength = characters.length;

                for (let i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }

                return result;
            },

            /**
             * Converts a string into lower-case and converts any whitespaces into underlines ('_').
             * 
             * @param {string} value - The input string to be sanitized. 
             * @returns {string}
             */
            sanitize: (value) => {
                if (!value) return '';
                
                return value.toLowerCase().replace(/^\s+$/g, '_');
            }
        };
    }
);