/**
 * @NApiVersion         2.1
 * @NModuleScope        SameAccount
 * 
 * @description         Helper module for NetSuite UI functions.
 * 
 * ===================================================================================================
 * Date                 Author                              Notes
 * 18/11/2025           Marlon Villarama                    Project setup; initial version
 * 
 */

define(
    [
        'N/ui/serverWidget',
        // './strings',
    ],
    (
        sw,
        // strings
    ) => {
        const MODULE = `BEX.UI`;
        const PREFIXES = {
            suitelet: 'custpage_dc_',
            field: 'custpage_bex_fld_',
            button: 'custpage_bex_btn_',
            sublist: 'custpage_bex_sl_',
            sublistfield: 'custpage_bex_slf_',
            subtab: 'custpage_bex_st_',
        };

        /**
         * @description         This class serves as a wrapper for the NetSuite Form object, providing helper methods for common UI tasks such as adding fields, buttons, sublists, and subtabs. It also includes methods for showing and hiding a spinner overlay.
         */
        class BEX_Form {
            form;

            constructor({ form }) {
                this.form = form;
            }

            /**
             * @return {sw.Form} Returns the underlying NetSuite Form object that is being wrapped by this class. This allows direct access to the Form's native methods and properties if needed.
             */
            get form() { return this.form; }

            /**
             * Adds a button to the form.
             * @param {Object} options - The parameters for the button.
             * @param {string} options.id - The ID of the button.
             * @param {string} [options.label='Button'] - The label of the button.
             * @param {boolean} [options.submit=false] - Whether the button is a submit button.
             * @param {Function} [options.trigger=null] - The function to trigger when the button is clicked.
             */
            addButton({ id, label = 'Button', submit = false, trigger = null }) {
                submit === true ?
                    this.form.addSubmitButton({ label, id: this.prefixButton(id) }) :
                    this.form.addButton({ label, id: this.prefixButton(id) });
            }

            /**
             * Adds a field to the form.
             * @param {Object} options - The parameters for the field.
             * @param {string} options.id - The ID of the field.
             * @param {string} options.label - The label of the field.
             * @param {string} options.type - The type of the field.
             * @param {string} [options.source] - The source of the field.
             * @param {string} [options.container] - The container of the field.
             * @returns {sw.Field} The created field.
             */
            addField({ id, label, type, source, container }) {
                let field = this.form.addField({
                    label, type, source, container,
                    id: this.prefixField(id)
                });
                return field;
            }

            /**
             * Adds a date field to the form.
             * @param {Object} options - The parameters for the date field.
             * @param {string} options.id - The ID of the date field.
             * @param {string} [options.label='Date'] - The label of the date field.
             * @param {string} [options.container] - The container of the date field.
             */
            addDateField({ id, label = 'Date', container }) {
                this.addField({
                    id, label, container,
                    type: sw.FieldType.DATE
                });
            }

            /**
             * Adds an HTML field to the form.
             * @param {Object} options - The parameters for the HTML field.
             * @param {string} options.id - The ID of the HTML field.
             * @param {string} [options.label='HTML Field'] - The label of the HTML field.
             * @param {string} [options.container=''] - The container of the HTML field.
             * @param {string} [options.value] - The default value of the HTML field.
             * @returns {sw.Field} The created HTML field.
             */
            addHtmlField({ id, label = 'HTML Field', container = '', value }) {
                if (!id) {
                    log.error({ title: `${MODULE}.AddHtmlField`, details: 'No field ID specified.' });
                    return;
                }

                let field = this.addField({
                    id, label, container,
                    type: sw.FieldType.INLINEHTML
                });

                if (value) {
                    field.defaultValue = value;
                }
            }

            /**
             * Adds a spinner overlay to the form. This method creates an HTML field that contains the necessary HTML, CSS, and JavaScript to display a spinner overlay on the form. The overlay can be shown or hidden using the `showSpinner` and `hideSpinner` methods of this class. Note that the spinner will not be visible until it is shown using the `showSpinner` method.
             */
            addSpinner() {
                let field = this.addField({
                    id: 'custpage_bex_spinner',
                    label: 'BEX Spinner',
                    type: 'inlinehtml',
                });
                
                field.defaultValue = `<script>
                    window.bexToggleOverlay = (show) => {
                        let overlay = document.getElementById('bex_overlay');
                        if (show === true) {
                            overlay.classList.remove('overlay_hide');
                        }
                        else {
                            overlay.classList.add('overlay_hide');
                        }
                    };
                </script>
                <div id="bex_overlay" class="overlay_hide">
                    <div class="bex_spinner">
                        <span class="spinner"></span>
                    </div>
                </div>
                <style>
                    #bex_overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        bottom: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1000;
                        background-color:rgba(0, 0, 0, 0.6);
                    }
                    .bex_spinner {
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center; 
                    }
                    .bex_spinner > .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px #ddd solid;
                        border-top: 4px #2e93e6 solid;
                        border-radius: 50%;
                        animation: sp-anime 0.8s linear infinite;
                    }
                    @keyframes sp-anime {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }
                    .overlay_hide {
                        display: none;
                    }
                </style>`;
            }

            /**
             * Adds a select field to the form.
             * @param {Object} options - The parameters for the select field.
             * @param {string} options.id - The ID of the select field.
             * @param {string} [options.label='Select'] - The label of the select field.
             * @param {string} [options.source] - The source of the select field.
             * @param {string} [options.container=''] - The container of the select field.
             * @param {Array} [options.items] - The items for the select field.
             * @returns {sw.Field} The created select field.
             */
            addSelectField({ id, label = 'Select', source, container = '', items }) {
                this.addField({
                    id, label, source, container,
                    type: sw.FieldType.SELECT
                });

                if (!items) { return; }
                if (!Array.isArray(items)) { return; }
                if (items.length <= 0) { return; }

                // TODO Populate items if supplied...
            }
            
            /**
             * Adds a text field to the form.
             * @param {Object} options - The parameters for the text field.
             * @param {string} options.id - The ID of the text field.
             * @param {string} [options.label='Text'] - The label of the text field.
             * @param {string} [options.container=''] - The container of the text field.
             * @param {string} [options.value] - The default value of the text field.
             * @returns {sw.Field} The created text field.
             */
            addTextField({ id, label = 'Text', container = '', value }) {
                let field = this.addField({
                    id, label, container,
                    type: sw.FieldType.TEXT
                });

                if (value) {
                    field.defaultValue = value;
                }
            }
            
            /**
             * Adds a textarea field to the form.
             * @param {Object} options - The parameters for the textarea field.
             * @param {string} options.id - The ID of the textarea field.
             * @param {string} [options.label='Textarea'] - The label of the textarea field.
             * @param {string} [options.container=''] - The container of the textarea field.
             * @param {string} [options.value] - The default value of the textarea field.
             * @returns {sw.Field} The created textarea field.
             */
            addTextAreaField({ id, label = 'Textarea', container = '', value }) {
                let field = this.addField({
                    id, label, container,
                    type: sw.FieldType.TEXTAREA
                });

                if (value) {
                    field.defaultValue = value;
                }
            }

            /**
             * Adds a sublist to the form.
             * @param {Object} options - The parameters for the sublist.
             * @param {string} options.id - The ID of the sublist.
             * @param {string} [options.label='Sublist'] - The label of the sublist.
             * @param {string} options.tab - The tab of the sublist.
             * @param {Array} [options.columns=[]] - The columns of the sublist.
             * @param {Array} [options.data=[]] - The data for the sublist.
             * @param {string} [options.type=sw.SublistType.LIST] - The type of the sublist.
             * @returns {sw.Sublist} The created sublist.
             */
            addSublist({ id, label = 'Sublist', tab, columns = [], data = [], type = sw.SublistType.LIST }) {
                const TITLE = `${MODULE}.AddSublist`;
                let sublistId = this.prefix('sublist', id);
                let sublist = this.form.addSublist({
                    data, label, type, tab,
                    id: sublistId
                });
                
                let columnMap = {};
                columns.forEach(c => {
                    // let columnId = `${sublistId}_${c.label.toLowerCase().replace(/\s/g, '_')}`;
                    let columnId = this.prefix('sublistfield', c.id.toLowerCase());
                    log.audit({ title: `${TITLE} columnId = ${columnId}`, details: c });

                    columnMap[columnId] = c;
                    let fld = sublist.addField({
                        id: columnId,
                        label: c.label,
                        type: c.label.toLowerCase() === 'notes' ? 'textarea' : (c.type || 'text'),
                        source: c.source
                    });
                });
                log.debug({ title: `${TITLE} columnMap`, details: columnMap });

                if (data.length <= 0) { return; }
                for (let line = 0, count = data.length; line < count; line++) {
                    // log.debug({ title: `${TITLE} *** line = ${line}`, details: data[line] });
                    for (const [columnId, c] of Object.entries(columnMap)) {
                        // log.debug({ title: `${TITLE} > columnId = ${columnId}; c = ${c.label}`, details: data[line][c.label] });
                        sublist.setSublistValue({
                            id: columnId,
                            line,
                            value: data[line][c.label] || '-'
                        });
                    }
                }
            }

            /**
             * Adds an inline editor sublist to the form.
             * @param {Object} options - The parameters for the inline editor sublist.
             * @param {string} options.id - The ID of the sublist.
             * @param {string} [options.label='Sublist'] - The label of the sublist.
             * @param {string} options.tab - The tab of the sublist.
             * @param {Array} [options.columns=[]] - The columns of the sublist.
             * @param {Array} [options.data=[]] - The data for the sublist.
             * @returns {sw.Sublist} The created inline editor sublist.
             */
            addSublistEditor({ id, label = 'Sublist', tab, columns = [], data = [] }) {
                if (columns.length <= 0) { return; }
                
                this.addSublist({
                    id, label, tab, columns, data,
                    type: sw.SublistType.INLINEEDITOR
                });
            }

            /**
             * Adds a subtab to the form.
             * @param {Object} options - The parameters for the subtab.
             * @param {string} options.id - The ID of the subtab.
             * @param {string} [options.label='Subtab'] - The label of the subtab.
             * @param {string} options.tab - The tab of the subtab.
             */
            addSubtab({ id, label = 'Subtab', tab }) {
                this.form.addSubtab({ id: this.prefix('subtab', id), label, tab });
            }

            /**
             * Gets a field from the form.
             * @param {string} id - The ID of the field.
             * @returns {sw.Field} The field with the specified ID.
             */
            getField(id) {
                return this.form.getField({ id });
            }

            /**
             * Prefixes a button ID with the appropriate prefix.
             * @param {string} id - The ID of the button.
             * @returns {string} The prefixed button ID.
             */
            prefixButton(id) {
                const TITLE = `${MODULE}.prefixButton`;

                if (!id) { return ''; }
                if (id.indexOf(PREFIXES.button) < 0) {
                    return `${PREFIXES.button}${id}`;
                }

                return id;
            }

            /**
             * Prefixes a field ID with the appropriate prefix.
             * @param {string} id - The ID of the field.
             * @returns {string} The prefixed field ID.
             */
            prefixField(id) {
                const TITLE = `${MODULE}.prefixField`;

                if (!id) { return ''; }
                if (id.indexOf(PREFIXES.field) < 0) {
                    return `${PREFIXES.field}${id}`;
                }

                return id;
            }

            /**
             * Prefixes an ID with the appropriate prefix based on the type.
             * @param {string} type - The type of the ID (e.g., 'button', 'field').
             * @param {string} id - The ID to be prefixed.
             * @returns {string} The prefixed ID.
             */
            prefix(type, id) {
                if (!id) { return ''; }
                if (!type) { return id; }

                return `${PREFIXES[type]}${id}`;
            }
        }

        return {
            /**
             * 
             * @param {Object} options
             * @param {sw.Form} options.form This is the form object passed in the onRequest function of a User Event Before Load or Suitelet script. Example: `onRequest(context) { let form = context.form; ... }`
             * @param 
             * @returns 
             */
            castForm: (options) => {
                const { form } = options;
                return new BEX_Form({ form });
            },

            /**
             * 
             * @param {Object} options
             * @param {string} options.title The title of the form. Default is 'Suitelet Form'.
             * @returns {BEX_Form}
             */
            createForm: (options) => {
                const { title = 'Suitelet Form' } = options || {};
                return new BEX_Form({ form: sw.createForm(title) });
            },

            /**
             * Hides the spinner overlay. The spinner must be added to the form first using the `addSpinner` method of the BEX_Form class.
             */
            hideSpinner: () => {
                document.getElementById('bex_overlay').classList.remove('overlay_hide');
            },

            /**
             * Shows the spinner overlay. The spinner must be added to the form first using the `addSpinner` method of the BEX_Form class.
             */
            showSpinner: () => {
                document.getElementById('bex_overlay').classList.add('overlay_hide');
            }
        };
    }
);