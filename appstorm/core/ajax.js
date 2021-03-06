/*! ***********************************************************************

    License: MIT Licence

    Description:
        Send a request to server side

************************************************************************ */



(function(a) {
    /**
     * Ajax cache object, used to store cached request and retrieve it if possible.
     *
     * @private
    */
    var ajaxCache = {
        /**
         * Add a new cached ajax element.
         *
         * @private
         *
         * @param {String} method               GET/POST/PUT/DELETE/...
         * @param {String} url                  The url to catch
         * @param {Object} results              The related result
         * @param {Integer} timeout             The timeout (in ms)
        */
        add: function(method, url, results, timeout) {
            if(timeout <= 0) {
                timeout = 1000;
            }

            var id = a.uniqueId(),
                obj = {
                id: id,
                method: method.toUpperCase(),
                url: url,
                results: results
            };

            a.mem.set('app.ajax.cache.' + obj.id, obj);

            // Creating the auto-delete timeout
            setTimeout(a.scope(function() {
                a.mem.remove('app.ajax.cache.' + this.id);
            }, obj), timeout);
        },

        /**
         * Get a previously cached element.
         *
         * @private
         *
         * @param {String} method               GET/POST/PUT/DELETE/...
         * @param {String} url                  The url to catch
         * @return {Object | Null}              Return the previously stored
         *                                      element or null if nothing is
         *                                      found
        */
        get: function(method, url) {
            if(!method || !url) {
                return null;
            }
            method = method.toUpperCase();

            var mem = a.mem.getInstance('app.ajax.cache'),
                list = mem.list();

            for(var key in list) {
                var element = list[key];

                if(element.method === method && element.url === url) {
                    return element.results;
                }
            }
            return null;
        }
        /*!
         * @private
        */
    };

    // Ajax status store function to detect which status is consider
    // as valid, and which is not
    a.ajaxStatus = [];
    a.mem.set('app.ajax.status', a.ajaxStatus);

    // Default one
    a.ajaxStatus.push(function (method, url, status) {
        if (status >= 200 && status <= 400) {
            return 'success';
        } else {
            return 'error';
        }
    });


    /**
     * Help to get a new model, or update an existing one, regarding
     * primary keys inside a model.
     *
     * @private
     *
     * @param {String} name                 The model name to search instance
     * @param {Array} primaries             List of primary key inside the
     *                                      model
     * @param {Object} content              The content of current model
     *                                      data (containing the primary
     *                                      key's data to match)
     * @return {a.modelInstance}            The new model created
    */
    function getOrCreateModel(name, primaries, content) {
        if(a.isNone(primaries) || (a.isArray(primaries) && 
            primaries.length === 0)) {
            return a.model.pooler.createInstance(name);
        } else {
            var search = {};
            // Adding primaries to search
            for(var i=0, l=primaries.length; i<l; ++i) {
                var tmp = content[primaries[i]];
                if(tmp) {
                    search[primaries[i]] = tmp;
                }
            }

            // Adding last model search
            search.modelName = name;

            var found = a.model.pooler.searchInstance(search);

            if(found.length > 0) {
                return found[0];
            } else {
                return a.model.pooler.createInstance(name);
            }
        }
    }

    /**
     * Ajax object to call server.
     *
     * @constructor
     *
     * @param {Object} options                  An option map to change
     *                                          the behaviour of component
     * @param {Function} success                The success function called
     *                                          in case of async
     * @param {Function} error                  The error function called in
     *                                          case of async
    */
    a.ajax = function(options, success, error) {
        'use strict';

        // New problem corrected
        if (!(this instanceof a.ajax)) {
            return new a.ajax(options, success, error);
        }

        var templates = [a.getDefaultAjaxOptions()];

        // Transforming single element into array
        if(a.isString(options.template) && options.template) {
            options.template = [options.template];
        }

        // Parsing array of templates
        if(a.isArray(options.template)) {
            for(var t=0, n=options.template.length; t<n; ++t) {
                var tmpAjaxOpt = a.getTemplateAjaxOptions(options.template[t]);
                if(a.isTrueObject(tmpAjaxOpt)) {
                    templates.push(tmpAjaxOpt);
                }
            }
        }

        this.params = {
            before : [],      // Allowed type : any string function name
            url    : '',      // Allowed type : any URL
            method : 'GET',   // Allowed type : "GET", "POST"
            type   : 'raw',   // Allowed type : raw, json, xml
            async  : true,    // Allowed type : true, false
            cache  : false,   // Allowed type : true, false
            store  : '',      // Allowed type : string like 4s
            data   : {},      // Allowed type : any kind of object | key => value
            header : {},      // Allowed type : any kind of object | key => value
            many   : false,   // Allowed type : true, false
            model  : '',      // Allowed type : any model name
            after  : []       // Allowed type : any string function name
        };

        // We override the cache by the "default" value
        if(a.environment.get('ajax.cache') === true) {
            this.params.cache = true;
        }

        // Binding options
        for(var p in this.params) {
            if(p === 'data' || p === 'header') {
                continue;
            }

            // We check given options are same type (from specific request)
            for(var o=0, l=templates.length; o<l; ++o) {
                var tmpl = templates[o];
                if(p in tmpl && typeof(tmpl[p]) === typeof(this.params[p])) {
                    // Special case for array
                    if(a.isArray(tmpl[p])) {
                        this.params[p] = a.union(this.params[p], tmpl[p]);
                    } else {
                        this.params[p] = tmpl[p];
                    }
                }
            }

            // We check given options are same type (from specific request)
            if(p in options && typeof(options[p]) === typeof(this.params[p])) {
                this.params[p] = options[p];
            }
        }

        // Now we take care of special case of data and header
        for(var i=0, y=templates.length; i<y; ++i) {
            var tmpla = templates[i];

            if(a.isTrueObject(tmpla.data)) {
                for(var d in tmpla.data) {
                    this.params.data[d] = tmpla.data[d];
                }
            }

            if(a.isTrueObject(tmpla.header)) {
                for(var h in tmpla.header) {
                    this.params.header[h] = tmpla.header[h];
                }
            }
        }

        if(a.isString(options.data)) {
            this.params.data = options.data;
        } else if(a.isTrueObject(options.data)) {
            for(var dd in options.data) {
                this.params.data[dd] = options.data[dd];
            }
        }

        if(a.isTrueObject(options.header)) {
            for(var hh in options.header) {
                this.params.header[hh] = options.header[hh];
            }
        }

        // Binding result function
        this.success = (a.isFunction(success)) ? success : function(){};
        this.error   = (a.isFunction(error)) ? error : function(){};

        // Detecting browser support of ajax (including old browser support
        this.request = null;
        if(!a.isNone(window.XMLHttpRequest)) {
            this.request = new XMLHttpRequest();
        // Internet explorer specific
        } else {
            var msxml = [
                'Msxml2.XMLHTTP.6.0',
                'Msxml2.XMLHTTP.3.0',
                'Msxml2.XMLHTTP',
                'Microsoft.XMLHTTP'
            ];
            for(var w=0, q=msxml.length; w<q; ++w) {
                try {
                    this.request = new ActiveXObject(msxml[w]);
                } catch(e) {}
            }
        }
    };

    /**
     * Parse the data to return the formated object (if needed).
     *
     * @private
     *
     * @param {Object} params                   The parameter list from
     *                                          configuration ajax
     * @param {Object} http                     The xmlHttpRequest started
     * @return {Object | String}                The parsed results
    */
    a.ajax.prototype.parseResult = function(params, http) {
        // Escape on special case HTTP 204
        if(http.status === 204) {
            return '';
        }

        //We are in non async mode, so the function should reply something
        var type = params.type.toLowerCase(),
            result = (type === 'json') ? a.parser.json.parse(http.responseText):
                    (type === 'xml') ? http.responseXML:
                    http.responseText;

        // User is asking for a model convertion
        if(params.model) {
            var modelName = params.model,
                errorStr = 'Model ' + modelName +
                            ' not found, empty object recieve Model Pooler';

            // We get primary elements from model
            var primaries = a.model.pooler.getPrimary(modelName);

            // Model not found
            if(primaries === null) {
                a.console.storm('error', 'a.ajax', errorStr, 1);

            // No primaries into the model, we create new model
            } else if(params.many === true && a.isArray(result)) {
                var content = [];
                for(var i=0, l=result.length; i<l; ++i) {
                    var data = result[i],
                        model = getOrCreateModel(modelName, primaries,
                                                            data);
                    if(model !== null) {
                        model.fromObject(data);
                        content.push(model);
                    } else {
                        a.console.storm('error', 'a.ajax', errorStr, 1);
                    }
                }
                // We replace
                result = content;
            } else {
                var fmdl = getOrCreateModel(modelName, primaries, result);

                // This test is probably not neeeded, but, who knows,
                // maybe one day it will raise to power and conquer
                // the world.
                if(fmdl) {
                    fmdl.fromObject(result);
                    result = fmdl;
                } else {
                    a.console.storm('error', 'a.ajax', errorStr, 1);
                }
            }
        }

        // After to use/parse on object
        if(params.hasOwnProperty('after')) {
            for(var t=0, k=params.after.length; t<k; ++t) {
                var fct = a.getAjaxAfter(params.after[t]);
                if(a.isFunction(fct)) {
                    result = fct.call(this, params, result);
                }
            }
        }

        // We cache if needed
        if(params.hasOwnProperty('store') && params.store) {
            var store = params.store,
                multiplier = 1;

            if(store.indexOf('min') > 0) {
                multiplier = 60000;
            } else if(store.indexOf('h') > 0) {
                multiplier = 3600000;
            } else if(store.indexOf('s') > 0) {
                multiplier = 1000;
            }

            // Adding element to store
            ajaxCache.add(params.method, params.url, result, 
                multiplier * parseInt(params.store, 10));
        }

        return result;
    };

    /**
     * Manually abort the request.
    */
    a.ajax.prototype.abort = function() {
        try {
            this.request.abort();
        } catch(e) {}
    };

    /**
     * Send the ajax request.
    */
    a.ajax.prototype.send = function() {
        var method = this.params.method.toUpperCase();

        // Skip request in some case, due to mock object (first test)
        var mockResult = a.mock.get(method, this.params.url, this.params.data);
        if(mockResult !== null) {
            var params = this.params;

            // We send a result
            a.message.dispatch('a.ajax', {
                success : true,
                status  : 200,
                url     : params.url,
                method  : method,
                params  : params
            });

            // Directly call success function
            this.success(mockResult, 200);

            // We don't proceed request
            return;
        }

        // We search for cached element
        if(a.isArray(this.params.before)) {
            var befores = this.params.before;
            for(var i=0, l=befores.length; i<l; ++i) {
                var before = a.getAjaxBefore(befores[i]);
                if(a.isFunction(before)) {
                    this.params = before.call(this, this.params);
                }
            }
        }

        // We search for cached element
        var cached = ajaxCache.get(
                            this.params.method || 'GET', this.params.url || '');
        // Something is existing, we return it instead or performing request
        if(cached) {
            this.success(cached, 200);
            return;
        }

        //Creating a cached or not version
        if(this.params.cache === false) {
            // Generate a unique random number
            var rnd = a.uniqueId('rnd_');
            // Safari does not like this...
            try {
                this.params.data.cachedisable = rnd;
            } catch(e) {}
        }

        //Creating the url with GET
        var toSend = '';

        if(a.isString(this.params.data)) {
            toSend = this.params.data;
        } else {
            for(var d in this.params.data) {
                toSend += encodeURIComponent(d) + '=' +
                        encodeURIComponent(this.params.data[d]) + '&';
            }
            //toSend get an extra characters & at the end, removing it
            toSend = toSend.slice(0, -1);
        }

        var url = this.params.url,
            async = this.params.async;
        if(method == 'GET' && toSend) {
            url += '?' + toSend;
        }

        //Catching the state change
        if(async === true) {
            // Scope helper
            var requestScope = {
                success     : this.success,
                params      : this.params,
                error       : this.error,
                request     : this.request,
                parseResult : this.parseResult
            };

            this.request.onreadystatechange = function() {
                // In some cases, the requestScope may be invalid
                // If user cancel the ajax request, so we use this try/catch
                // To prevent this error.
                var status = -1;
                try {
                    status = requestScope.request.status;
                } catch(e) {
                    return;
                }

                // IE9 Bug as reported in jQuery.
                if (status === 1223) {
                    status = 204;
                }

                // Any 200 status will be validated
                if(requestScope.request.readyState === 4) {
                    var great = (status >= 200 && status < 400);

                    // Parsing all possible ajax status handler
                    var great = false,
                        tmpSt = null,
                        u     = a.ajaxStatus.length;
                    while (u--) {
                        tmpSt = a.ajaxStatus[u].call(this, requestScope.method,
                                requestScope.params.url, status);
                        if (tmpSt === 'success') {
                            great = true;
                            // Everything went fine
                            requestScope.success(
                                requestScope.parseResult(requestScope.params,
                                        requestScope.request),
                                status
                            );
                            break;
                        } else if (tmpSt === 'error') {
                            // An error occurs
                            requestScope.error(url, status);
                            break;
                        }
                    }

                    // We send a result
                    a.message.dispatch('a.ajax', {
                        success : great,
                        status  : status,
                        url     : requestScope.params.url,
                        method  : requestScope.method,
                        params  : requestScope.params
                    });
                }
            };
        }

        //Openning the url
        this.request.open(method, url, async);

        //Setting headers (if there is)
        var contentTypeDefault = ['Content-Type', 'Content-type', 'content-type'],
            contentTypeFound   = false;
        for(var header in this.params.header) {
            this.request.setRequestHeader(header, this.params.header[header]);

            // In case of POST:
            //   a specific content type (a default one) may be needed
            if(!contentTypeFound && a.contains(contentTypeDefault, header)) {
                contentTypeFound = true;
            }
        }

        // Set a default one if not already set by user
        if(!contentTypeFound && method === 'POST') {
            this.request.setRequestHeader(
                'Content-type',
                'application/x-www-form-urlencoded'
            );
        }

        // Skip request in some case, due to mock object (second test)
        mockResult = a.mock.get(method, this.params.url);
        if(mockResult !== null) {
            // We send a result
            a.message.dispatch('a.ajax', {
                success : true,
                status  : 200,
                url     : this.params.url,
                method  : method,
                params  : this.params
            });

            // Directly call success function
            this.success(mockResult, 200);

            // We don't proceed request
            return;

        // We proceed normal ajax request
        } else {
            this.request.send(toSend);
        }

        return (async === false) ?
                this.parseResult(this.params, this.request) :
                'No return in async mode';
    };


    /*
     * -------------------------------
     *   APPSTORM TEMPLATE
     * -------------------------------
    */
    // Some basic template to use
    a.setTemplateAjaxOptions('json', {
        type: 'json',
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    a.setTemplateAjaxOptions('xml', {
        type: 'xml',
        header: {
            'Content-Type': 'application/xml',
            'Accept': 'application/xml'
        }
    });

    // Many models
    a.setTemplateAjaxOptions('list', {many: true});
    a.setTemplateAjaxOptions('array', {many: true});
    a.setTemplateAjaxOptions('many', {many: true});

    // Cache management
    a.setTemplateAjaxOptions('cache-enable', {
        cache: true
    });
    a.setTemplateAjaxOptions('cache-disable', {
        cache: false
    });

    // Creating http verb
    var verbs = ['POST', 'PUT', 'GET', 'DELETE', 'HEAD', 'OPTIONS',
                 'CONNECT', 'TRACE', 'PATCH'];
    for(var z=0, r=verbs.length; z<r; ++z) {
        (function(verb) {
            a.setTemplateAjaxOptions(verb, {
                method: verb
            });
        })(verbs[z]);
    }

})(window.appstorm);