/*! ***********************************************************************

    License: MIT Licence

    Description:
        Provide easy store object, with global prefix value system on top of it

************************************************************************ */


/**
 * Provide easy store object, with global prefix value system on top of it.
 *
 * @constructor
*/
a.mem = (function() {
    var store = {};

    /**
     * Sanitize a key to generate a 'usable' key.
     *
     * @private
     *
     * @param {String} key                  The key string to sanitize
     * @return {String}                     The key sanitize
    */
    function sanitizeKey(key) {
        if(!a.isString(key)) {
            return null;
        }

        // remove all whitespace
        key = key.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '')
                 .replace(/\s+/g, ' ');

        // Sanitize double .. and replace by '.'
        while(key.indexOf('..') >= 0) {
            key = key.replace(/(\.\.)/g, '.');
        }

        // Remove '.' at the beginning and at the end
        if(key.charAt(0) == '.') {
            key = key.substring(1);
        }
        if(key.charAt(key.length - 1) == '.') {
            key = key.substr(0, key.length - 1);
        }
        return key;
    }

    /**
     * Get a stored element.
     *
     * @private
     *
     * @param {String} key                  The key to retrieve value from
     * @return {Object | Null}              null in case of not found, and
     *                                      the stored value if found
    */
    function getFromStore(key) {
        key = sanitizeKey(key);
        if(key) {
            var result = store[key];
            if(!a.isUndefined(result)) {
                return result;
            }
        }
        return null;
    }

    /**
     * Get the full stored elements.
     *
     * @private
     *
     * @param {String} prefix               The prefix to use as 'search from
     *                                      that point'
     * @return {Object}                     A key value object with all values
     *                                      found matching prefix
    */
    function listFromStore(prefix) {
        var key = sanitizeKey(prefix);
        if(!key) {
            return store;
        } else {
            var partialStore = {};
            a.each(store, function(value, index) {
                if(index.indexOf(key) === 0) {
                    // We remove the prefix stored
                    var parsedIndex = index.substring(key.length + 1);
                    partialStore[parsedIndex] = value;
                }
            });
            return partialStore;
        }
    }

    /**
     * Store a new element, or erase a previous element.
     *
     * @private
     *
     * @param {String} key                  The key to set value linked to
     * @param {Object} value                The value to associate to key
    */
    function setToStore(key, value) {
        key = sanitizeKey(key);
        if(key) {
            store[key] = value;
        }
    }

    /**
     * Remove an element from store.
     *
     * @private
     *
     * @param {String} key                  The key to erase from store
    */
    function removeFromStore(key) {
        key = sanitizeKey(key);
        delete store[key];
    }


    /**
     * Clear the full store.
     *
     * @private
     *
     * @param {String} prefix               The prefix to clear.
    */
    function clearStore(prefix) {
        for(var key in store) {
            if(key.indexOf(prefix) === 0) {
                delete store[key];
            }
        }
    }


    /**
     * Generic object to derivate from prefix element.
     *
     * @private
     *
     * @param {String} prefix               The prefix
    */
    var genericObject = function(prefix) {
        this.prefix = prefix;
    };

    // Create the default prototype instance
    genericObject.prototype = {
        /**
         * Get a stored element.
         *
         * @param {String} key              The key to retrieve value from
         * @return {Object | Null}          null in case of not found, and
         *                                  the stored value if found
        */
        get: function(key) {
            return getFromStore(this.prefix + '.' + key);
        },

        /**
         * Get the full currently stored elements.
         *
         * @return {Object}                  An object of all currently stored
         *                                   elements
        */
        list: function() {
            return listFromStore(this.prefix);
        },

        /**
         * Store a new element, or erase a previous element.
         *
         * @param {String} key              The key to set value linked to
         * @param {Object} value            The value to associate to key
        */
        set: function(key, value) {
            setToStore(this.prefix + '.' + key, value);
        },

        /**
         * Remove an element from store.
         *
         * @param {String} key              The key to erase from store
        */
        remove: function(key) {
            removeFromStore(this.prefix + '.' + key);
        },

        /**
         * Clear everything stored inside store.
        */
        clear: function() {
            // Must be a string not empty...
            if(this.prefix) {
                clearStore(this.prefix);
            }
        }
        /*!
         * @private
        */
    };

    var defaultInstance = new genericObject('');

    /**
     * Retrieve a custom mem object to manipulate from root prefix.
     *
     * @param {String} prefix               The prefix to use as base
     * @return {Object}                     An instance ready to use
    */
    defaultInstance.getInstance = function(prefix) {
        return new genericObject(prefix);
    };
    /*!
     * @private
    */

    // return the custom object
    return defaultInstance;
})();


/*
------------------------------
  HANDLEBARS HELPERS
------------------------------
*/
(function() {
    // Get mem elements
    Handlebars.registerHelper('mem', function(value) {
        return new Handlebars.SafeString(a.mem.get(value));
    });
})();