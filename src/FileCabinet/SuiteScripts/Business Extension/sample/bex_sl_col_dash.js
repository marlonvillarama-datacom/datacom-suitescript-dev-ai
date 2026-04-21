/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/format', 'N/runtime'],
    function (serverWidget, search, record, format, runtime) {
        function onRequest(context) {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Custom Column Dashboard'
                });
                context.response.writePage(form);
            }
            else if (context.request.method === 'POST') {
                var request = context.request;
                var startDate = request.parameters.start_date;
                var endDate = request.parameters.end_date;
                var salesOrderSearch = search.create({
                    type: search.Type.SALES_ORDER,
                    filters: [
                        ['createddate', 'within', startDate, endDate]
                    ],
                    columns: [
                        'tranid',
                        'entity',
                        'createddate',
                        'total'
                    ]
                });
                var searchResult = salesOrderSearch.run().getRange({
                    start: 0,
                    end: 100
                });
                var form = serverWidget.createForm({
                    title: 'Sales Orders from ' + startDate + ' to ' + endDate
                });
                var sublist = form.addSublist({
                    id: 'salesorders',
                    label: 'Sales Orders',
                    type: serverWidget.SublistType.LIST
                });
                sublist.addField({
                    id: 'tranid',
                    label: 'Transaction ID',
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: 'entity',
                    label: 'Customer',
                    type: serverWidget.FieldType.TEXT
                });
                sublist.addField({
                    id: 'createddate',
                    label: 'Created Date',
                    type: serverWidget.FieldType.DATE
                });
                sublist.addField({
                    id: 'total',
                    label: 'Total',
                    type: serverWidget.FieldType.CURRENCY
                });
                for (var i = 0; i < searchResult.length; i++) {
                    sublist.setSublistValue({
                        id: 'tranid',
                        line: i,
                        value: searchResult[i].getValue('tranid')
                    });
                    sublist.setSublistValue({
                        id: 'entity',
                        line: i,
                        value: searchResult[i].getText('entity')
                    });
                    sublist.setSublistValue({
                        id: 'createddate',
                        line: i,
                        value: format.format({
                            value: searchResult[i].getValue('createddate'),
                            type: format.Type.DATE
                        })
                    });
                    sublist.setSublistValue({
                        id: 'total',
                        line: i,
                        value: searchResult[i].getValue('total').toString()
                    });
                }
                context.response.writePage(form);
            }

        }
    }
);