/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/dc.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             Suitelet
 * 
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 * 
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 * 
 * @description             Backend Suitelet script for performing AJAX actions on collection-related records.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 27/02/2026           Marlon Villarama                    Project setup; initial version
 * 
 */

define(
    [
        'BEX/search2',
    ],
    (
        search,
    ) => {
        const MODULE = `BEX.SL.Test`;

        return {
            onRequest: (context) => {
                const TITLE = `${MODULE}.Request`;
                let { request, response } = context;

                // let results = search.load({ id: 'customsearch_bex_act_cts' }).json();
                // log.debug({ title: `${TITLE} json = ${results.length}`, details: results });
                
                // results = search.load({ id: 'customsearch_bex_act_cts' }).csv();
                // log.debug({ title: `${TITLE} csv = ${results.length}`, details: results });

                let taskSearch = search.init({
                    id: 'customsearch_bex_act_cts'
                });
                let results = taskSearch.csv({
                    text: [
                        'Classification'
                    ]
                });
                log.debug({ title: `${TITLE} results = ${results.length}`, details: results });
            }
        };
    }
);