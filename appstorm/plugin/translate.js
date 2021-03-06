/*! ***********************************************************************

    License: MIT Licence

    Description:
        Manage translation

************************************************************************ */

/**
 * A translation system, used to get multi languages support to your app.
 *
 * @constructor
*/
a.translate = a.i18n = (function() {
    'use strict';

    // Internal variable
    var language         = 'en-US',
        dictionnary      = {},
        globalVariable   = {},
        defaultAttribute = 'tr',
        customAttribute  = 'custom-tr',
        eraseAttribute   = 'erase-tr',
        regexVariable    = /\{\{[a-z0-9\-_]+\}\}/gi;

    var storageSupported = (a.storage && a.storage.persistent.support);

    /**
     * Get attribute stored into given element.
     *
     * @private
     *
     * @param {DOMElement} element          The dom object to get
    *                                       attribute from
     * @param {String} search               The attribute name searched
     * @return {String}                     The founded attribute
     *                                      content or empty string
    */
    function getAttr(element, search) {
        return  element.getAttribute(search) || 
                element.getAttribute('a-' + search) ||
                element.getAttribute('data-' + search) ||  '';
    }

    /**
     * Apply to a given element the given translation.
     *
     * @private
     *
     * @param {DOMElement} node             The element to apply
     * @param {String} translation          The translation to apply
    */
    function applyTranslationToElement(node, translation) {
        var customTagAttribute = getAttr(node, customAttribute);

        if(customTagAttribute && customTagAttribute !== '') {
            try {
                node[customTagAttribute] = translation;
            } catch(e) {}
            return;
        }

        // We are on a submit/reset button
        if(node.nodeName == 'INPUT') {
            var type = node.type;
            if(type === 'submit' || type === 'reset' || type === 'button') {
                node.value = translation;
            } else {
                try {
                    node.placeholder = translation;
                } catch(e) {}
            }

        // On fieldset we apply title
        } else if(node.nodeName === 'FIELDSET') {
            node.title = translation;

        // XML translate (only for IE)
        //} else if(!a.isNone(node.text) && document.all ) {
        //    node.text = translation;

        // We are in erase mode, so we erase everything
        } else if(getAttr(node, eraseAttribute) !== '') {
            a.dom.el(node).empty().append(
                document.createTextNode(translation)
            );

        // We do translation system
        } else {
            // We separate textnode and other elements using <tag> element
            var splittedTranslation = translation.split('<tag>'),
                i = 0,
                l = node.childNodes.length,
                m = splittedTranslation.length;

            // 1) We remove text node elements
            for(; i<l; ++i) {
                var el = node.childNodes[i];
                if(el && el.nodeType == 3) {
                    el.parentNode.removeChild(el);
                }
            }

            i = 0;
            a.dom.el(node).children().each(function() {
                var tr   = splittedTranslation[i] || '',
                    text = document.createTextNode(tr);
                i++;

                this.parentNode.insertBefore(text, this);
            });

            // We add latests elements to end
            if(m > i) {
                for(var j=0, k=(m-i); j<k; ++j) {
                    node.appendChild(
                        document.createTextNode(splittedTranslation[i + j])
                    );
                }
            }
        }
    }

    /**
     * Apply translation to a given document/sub-document.
     *
     * @param {DOMElement | Null} root      The root element to 
     *                                      start translate from
    */
    function i18n(root) {
        root = root || document;

        // Selecting elements
        var el   = a.dom.el(root),
            // We search 'tr' and 'data-tr' tag on elements
            srch = defaultAttribute + ',a-' + defaultAttribute + ',data-' +
                    defaultAttribute;

        var currentDictionnary = dictionnary[language] || {};

        var elements = el.attr(srch).getElements();

        // Elements may have also the initial element itself
       if(root.getAttribute && 
            (
                root.getAttribute(defaultAttribute) ||
                root.getAttribute('a-' + defaultAttribute) ||
                root.getAttribute('data-' + defaultAttribute)
            )) {
            elements.push(root);
        }

        // Selecting only elements with tr/a-tr/data-tr html tag setted
        a.dom.el(elements).each(function() {
            // Getting the searched key translate
            var key       = getAttr(this, defaultAttribute),
                attribute = currentDictionnary[key] || '';

            // In case of trouble, we rollback on key elements
            if(attribute === '') {
                attribute = key;
            }

            // use regexVariable to extract variable from string
            var foundVariables = attribute.match(regexVariable);
            // We got something like ['{{a}}', '{{b}}']

            // We remove '{{' and '}}'
            var matches = a.map(foundVariables, function(value) {
                return value.replace('{{', '').replace('}}', '');
            });

            // We create final variables object
            var variables = {},
                i=matches.length;
            while(i--) {
                var variable = matches[i],
                    searchedVariable = defaultAttribute + '-' + variable,
                    value = getAttr(this, searchedVariable);
                if(value) {
                    variables[variable] = value;
                }
            }

            // Now we extract variable, we need to translate
            var translate = get(key, variables, true);

            // Finally we can apply translation
            applyTranslationToElement(this, translate);
        });
    }

    /**
     * Get the current used language.
     *
     * @return {String}                     The language setted by
     *                                      user/system (default is 'en-US')
    */
    function getLanguage() {
        return language;
    }

    /**
     * Set the current used language.
     * Auto-translate current document except if update is set to false.
     *
     * @param {String} lang                 The new language to apply
     * @param {Boolean | Null} update       If we should translate
     *                                      current (default: yes)
    */
    function setLanguage(lang, update) {
        if(!a.isString(lang) || !lang) {
            a.console.storm('error', 'a.translate.setLanguage', 'Setting a ' +
                    'non-string lang, or empty string, as default translate: ',
                            '```' + lang + '```. Cannot proceed', 1);
            a.console.error(lang);
        } else {
            language = lang;

            if(storageSupported) {
                a.storage.persistent.set('app.language', language);
            }

            if(update !== false) {
                i18n();
            }
        }
    }

    /**
     * Get any global variable setted.
     *
     * @param {String} key                  The variable key to search
     * @return {String}                     The variable value or
     *                                      an empty string if not found
    */
    function getGlobalVariable(key) {
        return globalVariable[key] || '';
    }

    /**
     * Set a global variable to be used if possible when translating.
     *
     * @param {String} key                  The variable key to register
     * @param {String} value                The linked value
    */
    function setGlobalVariable(key, value) {
        globalVariable[key] = value;
    }

    /**
     * Register a new translation for given language.
     * After register is done, you can now use data-tr='{{hash}}' inside
     * HTML page to have corresponding translation.
     * Note: you can use a quicker version add(lang, object, update)
     * Where the object will be a key/value translate list for lang.
     *
     * @private
     *
     * @param {String} lang                 The language to
     *                                      register hash/value pair
     * @param {String} hash                 The refered hash to
     *                                      use for translation
     * @param {String} value                The linked translation
     *                                      for given language
     * @param {Boolean | Null} update       If we should fully
     *                                      update or not document
    */
    function add(lang, hash, value, update) {
        if(a.isTrueObject(hash)) {
            a.each(hash, function(val, index) {
                add(lang, index, val, update);
            });
            return;
        }
        if(!dictionnary[lang]) {
            dictionnary[lang] = {};
        }

        dictionnary[lang][hash] = value;

        if(update !== false) {
            i18n();
        }
    }

    /**
     * Set a new translation set for a given language.
     * If dict is set to null, it will erase language.
     *
     * @param {String} lang                 The language to register dict
     * @param {Object} dict                 A key/value pair object for
     *                                      registrating many translation
     *                                      at once
     * @param {Boolean | Null} update       If we should fully
     *                                      update or not document
    */
    function set(lang, dict, update) {
        if(dict === null) {
            delete dictionnary[lang];
        } else {
            for(var i in dict) {
                add(lang, i, dict[i], false);
            }
        }

        if(update !== false) {
            i18n();
        }
    }

    /**
     * Get an existing translation stored.
     *
     * @param {String | Null} key           The searched translation key
     * @param {Object | Null} variables     Any key/value pair variable to pass
     * @param {Boolean | Null} translate    If we should or not translate
     *                                      (including variable) or simply
     *                                      send back entry (default: true)
     *
     * @return {String}                     The translated key or an empty
     *                                      string in case of problem
    */
    function get(key, variables, translate) {
        if(!dictionnary[language]) {
            return key;
        }
        var tr = dictionnary[language][key] || null;

        if(a.isNull(tr)) {
            return key;
        }

        if(translate === false) {
            return tr;
        }

        /**
         * From a hash, try to find the good variable content.
         *
         * @private
         *
         * @param {String} hash             The hash to find in variable list
         * @return {String}                 The variable content or empty
         *                                  string in case of not found
        */
        function hashToVariable(hash) {
            var lvar = variables,
                gvar = globalVariable,
                // First local var, and second global var check
                avar = [lvar, gvar];

            for(var i=0; i<2; ++i) {
                for(var j in avar[i]) {
                    if(hash === '{{' + j + '}}') {
                        return avar[i][j];
                    }
                }
            }

            // Nothing found
            return '';
        }

        var trVariables = tr.match(regexVariable) || [];

        for(var i=0, l=trVariables.length; i<l; ++i) {
            var el = trVariables[i];
            tr = tr.replace(el, hashToVariable(el));
        }

        // If it has still some unknow variable, we remove them...
        return tr.replace(regexVariable, '');
    }

    /**
     * Get the full stored dictionnary.
     *
     * @param {String | Null} lang          If lang is setted, retrieve only
     *                                      the given language. In other cases
     *                                      retrieve all dictionnaries.
    */
    function getDictionnary(lang) {
        if(lang) {
            return dictionnary[lang] || {};
        }
        return dictionnary;
    }


    /**
     * Erase dictionnary.
     *
     * @private
    */
    function clearDictionnary() {
        dictionnary = {};
    }



    // If storage is enabled, we try to get the stored language in the store
    if(storageSupported) {
        var storedLanguage = a.storage.persistent.get('app.language');

        // If language do exist and is setted
        if(a.isString(storedLanguage) && storedLanguage.length > 0) {
            language = storedLanguage;
            i18n();
        }
    }



    // Final object
    return {
        getLanguage: getLanguage,

        /**
         * Alias getLanguage.
         *
         * @see getLanguage
        */
        getCurrent:  getLanguage,

        setLanguage: setLanguage,

        /**
         * Alias setLanguage.
         *
         * @see setLanguage
        */
        setCurrent:  setLanguage,

        /**
         * Alias i18n.
         *
         * @see i18n
        */
        translate:   i18n,
        i18n:        i18n,

        getDictionnary:    getDictionnary,

        getGlobalVariable: getGlobalVariable,
        setGlobalVariable: setGlobalVariable,

        /**
         * Alias setGlobalVariable.
         *
         * @see setGlobalVariable
        */
        addGlobalVariable: setGlobalVariable,

        add:            add,

        /**
         * Alias add.
         *
         * @see add
        */
        addTranslation: add,

        get:            get,

        /**
         * Alias get.
         *
         * @see get
        */
        getTranslation: get,

        set:            set,

        /**
         * Alias set.
         *
         * @see set
        */
        setTranslation: set,

        /**
         * Erase dictionnary.
        */
        clear: clearDictionnary
    };
})();



/*
------------------------------
  HANDLEBARS HELPERS
------------------------------
*/
(function() {
    Handlebars.registerHelper('tr', function() {
        return new Handlebars.SafeString(
                a.translate.get.apply(null, arguments));
    });
    Handlebars.registerHelper('translate', function(value) {
        return new Handlebars.SafeString(
                a.translate.get.apply(null, arguments));
    });
})();