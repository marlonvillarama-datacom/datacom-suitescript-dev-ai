/**
 * @NAmdConfig              /SuiteScripts/Shared_Modules/config/bex.json
 * @NApiVersion             2.1
 * @NModuleScope            SameAccount
 * @NScriptType             MapReduceScript
 *
 * Copyright (c) 2026 Datacom, Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Datacom, Inc. ("Confidential Information").
 *
 * @description             Map/Reduce script description goes here...
 *
 * ===================================================================================================
 * Date                 Author                              Notes
 * <today>              <your_name>                         Initial version
 * 
 */

define(
    [
        'N/crypto/certificate',
        'N/https',
        'N/record',
        'N/runtime',
        'N/url',
        
        'BEX/params',
        'BEX/search',
        'BEX/strings',
    ],
    (
        cert,
        https,
        record,
        runtime,
        url,

        params,
        search,
        strings,
    ) => {
        const MODULE = `BEX.UpdateVB.MR`;
        const PARAMS = {
            vbSearch: 'custscript_bex_oa_vb_mr_ss'
        };

        const COLUMNS = {
            OPENAIR_RATE: 'custcol_oa_po_rate',
            RATE: 'rate'
        };

        const getSRPSettings = () => {
            const TITLE = `${MODULE}.GetSRPSettings`;
            let srpSearch = search.create({
                type: 'customrecord_oa_srp_integration_settings',
                columns: [
                    'custrecord_oa_realtime_email',
                    'custrecord_oa_realtime_enable',
                    'custrecord_oa_realtime_sso_record',
                    'custrecord_oa_realtime_include_lead',
                    'custrecord_oa_realtime_include_prospect',
                    'custrecord_oa_url',
                    'custrecord_oa_db_id',
                    'custrecord_oa_realtime_soap_customer',
                    'custrecord_oa_realtime_soap_project',
                    'custrecord_oa_realtime_soap_user',
                    'custrecord_oa_realtime_restlet_customer',
                    'custrecord_oa_realtime_restlet_project',
                    'custrecord_oa_realtime_restlet_user'
                ],
            }).getJson();

            log.debug({ title: TITLE, details: srpSearch });
            return srpSearch.length > 0 ? srpSearch[0] : null;
        };

        const getTriggerUrl = (options) => {
            const { id, settings, thread } = options;
            const TITLE = `${MODULE}.GetTriggerUrl ${thread}`;

            let oaUrl = settings.custrecord_oa_url;
            let oaDbId = settings.custrecord_oa_db_id;
            if (oaUrl && oaDbId) {
                oaUrl = oaUrl.replace(/\/+$/, '');
                let signer = cert.createSigner({
                    certId: "custcertificate_oa_realtime",
                    algorithm: cert.HashAlg.SHA256
                });

                let triggerParams = {
                    action: "synchronize",
                    db_id: oaDbId,
                    record_type: 'vendorbill',
                    ns_id: id,
                    netsuite_user_id: -5,
                    other_types: ''
                };

                let signatureInputParams = [
                    "action",
                    "db_id",
                    "record_type",
                    "ns_id",
                    "netsuite_user_id",
                    "other_types"
                ];

                let signatureInput = signatureInputParams.map((key) => key + "=" + triggerParams[key]).join("&");
                signer.update(signatureInput);

                triggerParams["signature"] = signer.sign();

                return url.format({
                    domain: oaUrl + "/netsuite.pl",
                    params: triggerParams
                });
            }

            let ssoRecord = settings.custrecord_oa_realtime_sso_record;
            let ssoURL = sso.generateSuiteSignOnToken(ssoRecord);
            ssoURL = ssoURL + '&record_type=' + oaRecordType + '&ns_id=' + recordId + '&netsuite_user_id=' + userId + '&other_types=' + other_types;
            
            log.audit({ title: `${TITLE} ssoURL`, details: ssoURL });
            return ssoURL;
        };

        const markExportToOpenAir = (options) => {
            const { id, thread } = options;
            const TITLE = `${MODULE}.MarkExportToOpenAir ${thread}`;

            let vendorBill = record.load({ type: 'vendorbill', id });
            let lineCount = vendorBill.getLineCount({ sublistId: 'item' });
            for (let line = 0; line < lineCount; line++) {
                let oaRate = vendorBill.getSublistValue({ sublistId: 'item', fieldId: 'rate', line });
                let rate = vendorBill.getSublistValue({ sublistId: 'item', fieldId: 'rate', line });
                vendorBill.setSublistValue({ sublistId: 'item', fieldId: 'custcol_oa_po_rate', line, value: rate });
            }
            vendorBill.setValue({ fieldId: 'custbody_oa_export_to_openair', value: true });
            vendorBill.save();

            log.audit({ title: TITLE, details: `Updated vendor bill ID ${id}.` });
        };

        const sendToOpenAir = (options) => {
            const { id, settings, thread } = options;
            const TITLE = `${MODULE}.SendToOpenAir ${thread}`;

            let headers = [];
            headers['User-Agent-x'] = 'SuiteScript-Call';

            let triggerUrl = getTriggerUrl({ id, settings, thread });
            log.audit({ title: `${TITLE} triggerUrl`, details: triggerUrl });

            let response = https.get({
                url: triggerUrl,
                headers: {
                    'User-Agent-x': 'SuiteScript-Call'
                }
            });
            log.debug({ title: TITLE, details: response.body });

            let matches;
            if (matches = response.body.match(/(Error:.*)/)) {
                let errorMsg = matches[1].replace(/<[^>]*>?/gm, '');
                log.error({
                    title: 'Error from SuiteProjects Pro',
                    details: errorMsg
                });
                throw errorMsg;
            }

            let responseStatus = {
                "responseText": "",
                "sendEmail": 0,
                "custrecord": [],
            };
            let setCustRecord = { 'field': 'custrecord_oa_synch_vendorbill' };

            if (response.body.match('vendorbill=T')) {
                setCustRecord.value = 'F';
            } else if (response.body.match('vendorbill=F')) {
                setCustRecord.value = 'T';
            }
            responseStatus.custrecord.push(setCustRecord);

            log.debug({ title: TITLE, details: responseStatus });
            return responseStatus;
        };

        const validate = () => {
            const TITLE = `${MODULE}.Validate`;
            let scriptParams = params.read({ map: PARAMS });

            if (!scriptParams[PARAMS.vbSearch]) {
                log.debug({ title: TITLE, details: 'Missing required parameter: Vendor bill search. Exiting...' });
                return false;
            }

            return true;
        };

        return {
            getInputData: () => {
                const TITLE = `${MODULE}.GetInputData`;
                let output = [];

                log.audit({ title: TITLE, details: '*** SCRIPT START ***' });
                if (validate() === false) {
                    log.audit({ title: TITLE, details: '*** SCRIPT END ***' });
                    return [];
                }

                let srpSettings = getSRPSettings();
                if (!srpSettings) {
                    log.audit({ title: TITLE, details: 'No SRP Settings record found. Exiting...' });
                    return [];
                }

                let scriptParams = params.read({ map: PARAMS });
                output = search.getJSON({ id: scriptParams[PARAMS.vbSearch] });
                output = output.map(d => {
                    return {
                        ...d,
                        settings: srpSettings
                    };
                });

                return output;
            },

            map: ({ key, value }) => {
                const THREAD = strings.random();
                const TITLE = `${MODULE}.Map ${THREAD}; key = ${key}`;
                let jsonObject = JSON.parse(value);
                log.debug({ title: TITLE, details: value });

                markExportToOpenAir({ id: jsonObject.id, thread: THREAD });

                let responseStatus = sendToOpenAir({
                    id: jsonObject.id,
                    settings: jsonObject.settings,
                    thread: THREAD
                });
                log.debug({ title: `${TITLE} responseStatus`, details: responseStatus });

                let recordSynch = record.load({
                    type: 'customrecord_oa_record_type_synch',
                    id: 1
                });
                for (let k = 0; k < responseStatus.custrecord.length; k++) {
                    let custRecordTemp = responseStatus.custrecord[k];
                    recordSynch.setValue({
                        fieldId: custRecordTemp['field'],
                        value: custRecordTemp['value'] === 'T'
                    });
                }

                recordSynch.save();
            },

            summarize: ({ mapSummary, output }) => {
                const TITLE = `${MODULE}.Summarize`;

                mapSummary.errors.iterator().each((k, v) => {
                    log.error({ title: `${TITLE} k = ${k}`, details: v });
                    return true;
                });

                log.debug({ title: TITLE, details: '*** SCRIPT END ***' });
            }
        };
    }
);
