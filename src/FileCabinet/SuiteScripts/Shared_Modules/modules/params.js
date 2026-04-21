/**
 * @NApiVersion         2.1
 * @NModuleScope        SameAccount
 * 
 * @description         Helper module for runtime script parameters.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 19/11/2025           Marlon Villarama                    Project setup; initial version
 * 
 */

define(
    [
        'N/runtime'
    ],
    (
        runtime
    ) => {
        const MODULE = `BEX.Params`;

        return {
            /**
             * Returns a single object containing script parameter identifiers and values.
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
            read: ({ map }) => {
                const TITLE = `${MODULE}.Read`;
                if (!map) { return output; }

                let output = {};
                for(const [k, v ] of Object.entries(map)) {
                    output[v] = runtime.getCurrentScript().getParameter({ name: v });
                }

                return output;
            }
        };
    }
);