/*! ***********************************************************************

    License: MIT Licence

    Description:
        Manipulate HTML form by with a simple system.

************************************************************************ */

/**
 * Manipulate HTML form by with a simple system.
 *
 * @constructor
*/
a.form = (function() {
    'use strict';

    // HTML/HTML5 input type allowed 
    var typePatternList  = ['text', 'search', 'url',
                                    'tel', 'email', 'password'],
        minMaxStepList   = ['number', 'range', 'date',
                                    'datetime', 'datetime-local',
                                    'month', 'time', 'week'],
        typeRequiredList = typePatternList.concat(minMaxStepList,
                                    ['number', 'checkbox', 'radio', 'file']),
        typeMultipleList = ['email', 'file'],
        typeList = minMaxStepList.concat(typePatternList,
                                    ['color', 'checkbox', 'file',
                                    'hidden', 'radio']);

    /**
     * Get the field key from given input.
     *
     * @private
     *
     * @param {DOMElement} e                The element o search value inside
     * @return {String}                     The value found
    */
    function getFieldKey(e) {
        var el   = a.dom.el(e),
            name = el.data('name');

        if(a.isNone(name) || name === '') {
            name = el.attribute('name');

            // Search the good attribute in case of problem
            if(a.isNone(name) || name === '') {
                name = el.attribute('id');

                // Should never appear... But we provide it in case of trouble
                if(a.isNone(name) || name === '') {
                    name = el.attribute('class');
                }
            }
        }

        return name;
    }

    /**
     * Get the field value for given input.
     *
     * @private
     *
     * @param {DOMElement} e                The element to search value inside
     * @return {String}                     The value found
    */
    function getFieldValue(e) {
        var type    = e.type || '',
            tagName = e.tagName.toLowerCase();

        if(tagName === 'input' || tagName === 'textarea') {
            return (type === 'checkbox') ? e.checked : e.value;
        } else if(tagName === 'select') {
            if(e.options[e.selectedIndex]) {
                return e.options[e.selectedIndex].value;
            }
            return null;
        }
    }

    /**
     * From a given dom, get the list of revelant elements inside.
     *
     * @private
     *
     * @param {a.dom} dom                   The dom element to search inside
     * @return {Array}                      The element list inside DOM
    */
    function getFieldList(dom) {
        // dom must be a a.dom element
        var elements = dom.tag(['input', 'textarea', 'select']).getElements();

        // We remove input who are not listed in typeList
        // LIKE: submit/reset should not appear in this list
        var i = elements.length;
        while(i--) {
            var el = elements[i];
            if(el.type &&
                    (   el.type == 'submit' ||
                        el.type == 'button' ||
                        el.type == 'reset' ||
                        el.type == 'image'
                    ) ) {
                elements.splice(i, 1);
            }
        }

        // Now filtering is done, we can send back all elements
        return elements;
    }

    /**
     * Raise an error on input.
     *
     * @private
     *
     * @param {DOMElement} el               The element where comes from error
     * @param {String} id                   The element id/name/class
     * @param {String | Null} name          The name (like min, pattern, ...)
     *                                      which is not valid, can be null
     * @param {String | Null} value         The current input value
     *                                      (can be used as parameter)
     * @return {Object}                     A validate object with everything
     *                                      inside if possible
    */
    function validateError(el, id, name, value) {
        // First : we need to get error element and translate if possible
        var error = '';

        // Retrieve error tag
        if(!a.isNone(name) && name !== '') {
            error = el['data-error-' + name] || null;
        }
        if(a.isNone(error) || error === '') {
            error = el['data-error'] || null;
        }

        if(a.isNone(error) || error === '') {
            var errorMessage  = 'A data-error tag has not been setted for id ';
                errorMessage += '```' + id + '``` with value ```' +value+'```';
                errorMessage += '.Cannot proceed error message...';
            a.console.storm('warn', 'a.form', errorMessage, 3);
        }

        // Translate error if possible
        error = a.translate.get(error, {
            name:  name,
            value: value
        });

        // Returning an object with all needed data inside
        return {
            el:    el,
            id:    id,
            error: error
        };
    }


    /**
     * We try to grab the model instance, or a new model instance if it's not
     * an existing model instance.
     *
     * @private
     *
     * @param {String} idOrModelName            From HTML side, the id or the
     *                                          model name to use for this form
     * @return {a.modelInstance}                A new or existing instance
    */
    function getModel(idOrModelName) {
        var model = a.model.manager.get(idOrModelName);
        if(model) {
            return model;
        } else {
            return a.model.pooler.createTemporaryInstance(idOrModelName);
        }
    }

    return {
        /**
         * Allow to skip HTML5 form-novalidate tag or not (boolean).
         * This help to avoid browser HTML5 validation to keep only AppStorm
         * one.
         *
         * @property skipNoValidate
         * @type Boolean
         * @default false
        */
        skipNoValidate: false,

        /**
         * Get the list of element stored into given form.
         *
         * @param {Object} dom              The dom element to search inside
         *                                  - It has to be a valid a.dom.el
         *                                  input
         * @return {Object}                 The list of input tags existing
        */
        get: function(dom) {
            dom = a.dom.el(dom);
            var inputList  = getFieldList(dom),
                outputList = {};

            var i = inputList.length;
            while(i--) {
                var input = inputList[i];

                var name  = a.trim(getFieldKey(input)),
                    value = getFieldValue(input);

                // We don't continue if we don't find any data on element
                if(a.isNone(name) || !name) {
                    continue;
                }

                var parse = false;

                // We got a special case with input radio type
                if(!a.isNone(input) && input.type === 'radio') {
                    // Only checked one are validated
                    if(input.checked) {
                        parse = true;
                    }
                } else if(!a.isNone(input) && input.type === 'checkbox') {
                    parse = false;
                    outputList[name] = (input.checked) ? true: false;
                } else {
                    parse = true;
                }

                if(parse) {
                    // Name is a multiple value one (using [] at the end)
                    if(name.substr(name.length - 2) === '[]') {
                        if(!a.isArray(outputList[name])) {
                            outputList[name] = [];
                        }
                        value = (value) ? value: null;
                        outputList[name].push(value);
                    } else {
                       outputList[name] = (value) ? value: null;
                   }
                }
            }

            return outputList;
        },

        /**
         * Validate a form.
         * Note : multiple tester (email, file) is not supported
         * Note : date field (date, datetime, datetime-local,
         * month, time, week) are not supported
         * Note : tel/file field are not supported
         *
         * @method validate
         *
         * @param {Object} dom              The dom element to search inside
         *                                  - It has to be a valid a.dom.el
         *                                  input
         * @return {Array}                  An array with all errors listed
         *                                  inside, an empty array if there
         *                                  is no error to show
        */
        validate: function(dom) {
            dom = a.dom.el(dom);
            // On form tag, the "novalidate" allow to not validate a form
            if(this.skipNoValidate === false &&
                    !a.isNone(dom.get(0).novalidate)) {
                return [];
            }

            var inputList    = getFieldList(dom),
                // Store all errors appearing
                errorList    = [],
                allowedTypes = ['number', 'range', 'text', 'search',
                                        'url', 'email', 'password',
                                        'color', 'checkbox',
                                        'hidden', 'radio'],
                // Pretty basic url tester
                urlTester    = new RegExp(
                    '^[a-z]{2,}:\\/\\/([a-z0-9\\/\\.\\-_~+;:&=]{2,})$', 'gi'),
                // Pretty basic email tester
                emailTester  = new RegExp('^.{2,}@.*\\.[a-z0-9]{2,}$', 'gi'),
                colorTester  = new RegExp('^#([a-f]{3}|[a-f]{6})$', 'gi');

            // required : at least one char
            //    (text, search, url, tel, email, password, date, datetime,
            //    datetime-local, month, time, week, number, checkbox,
            //    radio, file)
            // pattern : a regex to test (Use title like a helper),
            //    (text, search, url, tel, email, password)
            //    multiple : the user is allowed to enter more than one element
            //    (only for email, file)
            // min/max : min/max value
            //    (number, range, date, datetime, datetime-local,
            //    month, time, week)
            // step : multiplier
            //    (number, range, date, datetime, datetime-local,
            //    month, time, week)
            var i = inputList.length;
            while(i--) {
                // Does only work for input tags
                var el      = inputList[i],
                    tagName = el.tagName.toLowerCase();

                // form novalidate : we must not validate
                // this element (including all select)
                if(tagName == 'select' || !a.isNone(el.novalidate)) {
                    continue;
                }

                var type     = el.type,
                    name    = getFieldKey(el),
                    value    = el.value,

                    required = el.required,
                    pattern  = el.pattern,
                    multiple = el.multiple,
                    min      = el.min,
                    max      = el.max,
                    step     = el.step;

                // Double check float data
                min  = (a.isNone(min) || min === '')   ? null :
                        parseFloat(min);
                max  = (a.isNone(max) || max === '')   ? null :
                        parseFloat(max);
                step = (a.isNone(step) || step === '') ? null :
                        parseFloat(step);

                // Check input type does existing in allowed type list
                if(tagName == 'input' && !a.contains(allowedTypes, type) &&
                        !a.isNone(type)) {
                    var errorSupport =  'Type ```' + type;
                        errorSupport += '``` for input ```' + name + '```';
                        errorSupport += 'is not recognized and/or supported';
                    a.console.storm('warn', 'a.form.validate', errorSupport,3);
                    continue;
                }

                // Now checking type
                if( (type == 'number' || type == 'range') &&
                        !a.isNumber(value) ) {
                    errorList.push(validateError(el, name, null, value));
                    continue;
                }
                if(type == 'url' && !urlTester.test(value) ) {
                    errorList.push(validateError(el, name, null, value));
                    continue;
                }
                if(type == 'email' && !emailTester.test(value) ) {
                    errorList.push(validateError(el, name, null, value));
                    continue;
                }
                if(type == 'color' && !colorTester.test(value) ) {
                    errorList.push(validateError(el, name, null, value));
                    continue;
                }

                // Required test
                if( required !== null && a.contains(typeRequiredList, type) &&
                        (value === '' || a.isNone(value)) ) {
                    errorList.push(validateError(el, name, 'required', value));
                    continue;
                }

                // Pattern test
                if( pattern !== null && (tagName === "textarea" || 
                        (a.contains(typePatternList, type)) || a.isNone(type))
                ) {
                    var reg = new RegExp(pattern);
                    if(!reg.test(value)) {
                        errorList.push(validateError(
                                            el, name, 'pattern', value));
                        continue;
                    }
                }

                // Min/max/step test
                if( (min !== null || max !== null || step !== null) &&
                        a.contains(minMaxStepList, type) ) {

                    var pval = parseFloat(value);
                    if( min !== null && pval < min ) {
                        errorList.push(validateError(el, name, 'min', value));
                        continue;
                    }
                    if( max !== null && pval > max ) {
                        errorList.push(validateError(el, name, 'max', value));
                        continue;
                    }
                    if( step !== null && pval % step !== 0 ) {
                        errorList.push(validateError(el, name, 'step', value));
                        continue;
                    }
                }
            }

            return errorList;
        },

        /**
         * Validate and get the form content.
         *
         * @param {Object} dom              The dom element to search inside
         *                                  - It has to be a valid a.dom.el
         *                                  input
         * @return {Object}                 An object with error (boolean),
         *                                  errorList (Array)
         *                                  and contentList (Array)
        */
        validateAndGet: function(dom) {
            var obj = {
                errorList   : this.validate(dom),
                error       : false,
                contentList : this.get(dom)
            };
            if(obj.errorList.length > 0) {
                obj.error = true;
            }
            return obj;
        }

        /*!
         * @private
        */
    };
})();