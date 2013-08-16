"use strict";
/* ************************************************************************

	Version: 0.4

	License: MIT Licence

	Authors: VILLETTE Charles

	Date: 2013-05-14

	Date of last modification: 2013-06-03

	Dependencies : [
		a.js
	]

	Events : [
		a.storage.add : {key : the key, value : the value}
		a.storage.remove : {key : the key}
		a.storage.temporary.change : {engine : the engine choosed by system}
		a.storage.persistent.change : {engine : the engine choosed by system}
	]

	Description:
		Storage capacities, allow to manage many storage to get quick access to everything

		cookie : Cookie functionnality, manipulate cookie with a simplified interface
		temporary : Use the "most powerfull" system in the whole list of temporary store available

************************************************************************ */
/**
 * @class storage
 * @extends a
 *
 * Storage capacities, allow to manage many storage to get quick access to everything
*/
a.storage = {
	/**
	 * Debug on console the get item action
	 *
	 * @param element {String} The element (like cookie, localStorage, ...)
	 * @param key {String} The key to debug
	 * @param value {Mixed} The value to dump
	*/
	__printGetItem : function(element, key, value) {
		if(key !== "__test_support") {
			a.console.log("a.storage.type." + element + ".getItem: get element (key: " + key + ", value: " + value + ")", 3);
		}
	},

	/**
	 * Debug on console the get item error action
	 *
	 * @param element {String} The element (like cookie, localStorage, ...)
	 * @param key {String} The key to debug
	*/
	__printGetErrorItem : function(element, key) {
		if(key !== "__test_support") {
			a.console.log("a.storage.type." + element + ".getItem: unable to find key (" + key + ") in store", 2);
		}
	},

	/**
	 * Debug on console the set item action
	 *
	 * @param element {String} The element (like cookie, localStorage, ...)
	 * @param key {String} The key to debug
	 * @param value {Mixed} The value to dump
	*/
	__printSetItem : function(element, key, value) {
		if(key !== "__test_support") {
			a.console.log("a.storage.type." + element + ".setItem: add element (key: " + key + ", value: " + value + ")", 3);
		}
	},

	/**
	 * Debug on console the remove item action
	 *
	 * @param element {String} The element (like cookie, localStorage, ...)
	 * @param key {String} The key to debug
	*/
	__printRemoveItem : function(element, key) {
		if(key !== "__test_support") {
			a.console.log("a.storage.type." + element + ".removeItem: remove element (key: " + key + ")", 3);
		}
	},

	/**
	 * @class type
	 * @extends a.storage
	 *
	 * Access to individual storage
	*/
	type:{}
};



/**
 * @class cookie
 * @extends a.storage.type
 *
 * Cookie functionnality, manipulate cookie with a simplified interface
*/
a.storage.type.cookie = (function() {
	"use strict";

	// Temporary desactivate event while making test
	var __active = false;

	// Define an object, but create some usefull data inside like "isEnabled" data which indicate support or not of cookies
	var obj = {
		support : false,
		engine  : "cookie",
		/**
		 * Set a new cookie, or delete a cookie using a too old expires
		 *
		 * @param name {String} The key to use
		 * @param value {Mixed} The value to store
		 * @param days {Integer} Number of days before expires
		*/
		setItem : function(name, value, days) {
			var expires = "";
			a.storage.__printSetItem("cookie", name, value);
			if(days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				expires = "; expires=" + date.toGMTString();
			}
			document.cookie = name + "=" + escape(a.parser.json.stringify(value)) + expires + "; path=/";
		},

		/**
		 * Get the stored cookie, return null if something went wrong
		 *
		 * @param name {String} The cookie name stored
		 * @returns {Mixed} Any data stored inside cookie
		*/
		getItem : function(name) {
			if (document.cookie.length > 0) {
				var c_start = document.cookie.indexOf(name + "=");
				if (c_start != -1) {
					c_start = c_start + name.length + 1;
					var c_end = document.cookie.indexOf(";", c_start);
					if (c_end == -1) {
						c_end = document.cookie.length;
					}
					var result = a.parser.json.parse(unescape(document.cookie.substring(c_start, c_end)));
					a.storage.__printGetItem("cookie", name, result);
					return result;
				}
			}
			a.storage.__printGetErrorItem("cookie", name);
			return null;
		},

		/**
		 * Remove a previously stored cookie
		 *
		 * @param name {String} The cookie name to delete
		*/
		removeItem : function(name) {
			a.storage.__printRemoveItem("cookie", name);
			this.setItem(name, "", -1);

			// Dispatch event
			if(__active) {
				a.message.dispatch("a.storage.remove", {
					key : name
				});
			}
		}
	};

	// Cookie
	// Testing the current
	var test = "__test_support";
	obj.setItem(test, "ok");

	// Test system is working
	if(obj.getItem(test) === "ok") {
		obj.removeItem(test);
		obj.support = true;
	}

	// Activate event
	__active = true;

	return obj;
})();


/**
 * @class cookie
 * @extends a.storage
 *
 * Cookie functionnality, manipulate cookie with a simplified interface
*/
a.storage.cookie = a.storage.type.cookie;





/**
 * @class localStorage
 * @extends a.storage.type
 *
 * LocalStorage HTML5 support
*/
a.storage.type.localStorage = (function() {
	"use strict";

	var __support = false,
		__idTest  = "__test_support",
		__ls      = "localStorage";

	// Test support (if you use localStorageShim this should work for most of browsers (including old IE) !)
	if(__ls in window && window[__ls] !== null) {
		// Testing database work or not
		window.localStorage.setItem(__idTest, "o");

		// Test system is working
		if(window.localStorage.getItem(__idTest) === "o") {
			window.localStorage.removeItem(__idTest);
			__support = true;
		}
	}

	return {
		support : __support,
		engine  : __ls,
		getItem : function(key) {
			if(__support) {
				var item = window.localStorage.getItem(key);
				if(a.isNull(item)) {
					a.storage.__printGetErrorItem("localStorage", key);
					return null;
				}
				var value = a.parser.json.parse(item);
				a.storage.__printGetItem("localStorage", key, value);
				return value;
			}
			return null;
		},
		setItem : function(key, value) {
			if(__support) {
				a.storage.__printSetItem("localStorage", key, value);
				window.localStorage.setItem(key, a.parser.json.stringify(value));
				a.message.dispatch("a.storage.add", {
					key : key,
					value : value
				});
			}
		},
		removeItem : function(key) {
			if(__support) {
				a.storage.__printRemoveItem("localStorage", key);
				window.localStorage.removeItem(key);
				a.message.dispatch("a.storage.remove", {
					key : key
				});
			}
		}
	};
})();



/**
 * @class globalStorage
 * @extends a.storage.type
 *
 * globalStorage HTML5 support (old)
*/
a.storage.type.globalStorage = (function() {
	"use strict";

	var __support  = false,
		__idTest   = "__test_support",
		__hostname = window.location.hostname;

	if(!a.isNull(window.globalStorage)) {
		window.globalStorage[__hostname].setItem(__idTest, "ok");

		// Test system is working
		if(window.globalStorage[__hostname].getItem(__idTest) == "ok") {
			window.globalStorage[__hostname].removeItem(__idTest);
			__support = true;
		}
	}

	return {
		support : __support,
		engine  : "globalStorage",
		getItem : function(key) {
			if(__support) {
				var item = window.globalStorage[__hostname].getItem(key);
				// On some system, item will be an object with "value" and "secure" property
				if(a.isObject(item) && !a.isNull(item.value)) {
					var value = a.parser.json.parse(item.value);
					a.storage.__printGetItem("globalStorage", key, value);
					return value;
				} else if(!a.isNull(item)) {
					var value = a.parser.json.parse(item);
					a.storage.__printGetItem("globalStorage", key, value);
					return value;
				} else {
					a.storage.__printGetErrorItem("globalStorage", key);
					return null;
				}
			}
			return null;
		},
		setItem : function(key, value) {
			if(__support) {
				a.storage.__printSetItem("globalStorage", key, value);
				window.globalStorage[__hostname].setItem(key, a.parser.json.stringify(value));
				a.message.dispatch("a.storage.add", {
					key : key,
					value : value
				});
			}
		},
		removeItem : function(key) {
			if(__support) {
				a.storage.__printRemoveItem("globalStorage", key);
				window.globalStorage[__hostname].removeItem(key);
				a.message.dispatch("a.storage.remove", {
					key : key
				});
			}
		}
	};
})();



/**
 * @class memory
 * @extends a.storage.type
 *
 * memory object (so if page close, everything is lost)
*/
a.storage.type.memory = (function() {
	"use strict";

	var __data = {};

	return {
		support : true,
		engine  : "memory",
		getItem : function(key) {
			var value = __data[key];
			if(!a.isNull(value)) {
				a.storage.__printGetItem("memory", key, value);
				a.console.log("a.storage.memory.getItem: found item (key: " + key + ", value: " + value + ")", 3);
				return value;
			}
			a.storage.__printGetErrorItem("memory", key);
			return null;
		},
		setItem : function(key, value) {
			__data[key] = value;
			a.storage.__printSetItem("memory", key, value);
			a.message.dispatch("a.storage.add", {
				key : key,
				value : value
			});
		},
		removeItem : function(key) {
			a.storage.__printRemoveItem("memory", key);
			if(!a.isNull(__data[key])) {
				delete __data[key];
				a.message.dispatch("a.storage.remove", {
					key : key
				});
			}
		}
	}
})();


/**
 * @class memory
 * @extends a.storage
 *
 * Memory store functionnality, manipulate memory storage class with a simplified interface
*/
a.storage.memory = a.storage.type.memory;





/**
 * @class sessionStorage
 * @extends a.storage.type
 *
 * sessionStorage HTML5 support
*/
a.storage.type.sessionStorage = (function() {
	"use strict";

	var __support = false,
		__idTest  = "__test_support",
		__ss      = "sessionStorage";


	// Test support
	if(__ss in window && !a.isNull(window[__ss])) {
		// Testing database work or not
		window.sessionStorage.setItem(__idTest, "o");

		// Test system is working
		if(window.sessionStorage.getItem(__idTest) === "o") {
			window.sessionStorage.removeItem(__idTest);
			__support = true;
		}
	}

	return {
		support : __support,
		engine  : __ss,
		getItem : function(key) {
			if(__support) {
				var item = window.sessionStorage.getItem(key);
				if(a.isNull(item)) {
					a.storage.__printGetErrorItem("sessionStorage", key);
					return null;
				}
				var value = a.parser.json.parse(item);
				a.storage.__printGetItem("sessionStorage", key, value);
				return value;
			}
			return null;
		},
		setItem : function(key, value) {
			if(__support) {
				a.storage.__printSetItem("sessionStorage", key, value);
				window.sessionStorage.setItem(key, a.parser.json.stringify(value));
				a.message.dispatch("a.storage.add", {
					key : key,
					value : value
				});
			}
		},
		removeItem : function(key) {
			if(__support) {
				a.storage.__printRemoveItem("sessionStorage", key);
				window.sessionStorage.removeItem(key);
				a.message.dispatch("a.storage.remove", {
					key : key
				});
			}
		}
	};
})();




/**
 * @class userData
 * @extends a.storage.type
 *
 * userData IE support (old)
*/
a.storage.type.userData = (function() {
	"use strict";

	var __support = false,
		__idTest  = "__test_support",
		uid       = "a_storage",
		dbName    = "aUserDataStorage";

	// Store for internet explorer

	// Test support
	if(document.all) {
		// On some IE, db.load and db.save may be disabled (binary behavior disable)...
		try {
			// Creating userData storage
			document.write('<input type="hidden" id="' + uid + '" style="display:none;behavior:url(\'#default#userData\')" />');
			var db = document.getElementById(uid);
			db.load(dbName);

			// Testing work before setting as default
			db.setAttribute(__idTest, "ok");
			db.save(dbName);

			// Test system is working
			if(db.getAttribute(__idTest) === "ok") {
				// Deleting test
				db.removeAttribute(__idTest);
				db.save(dbName);

				__support = true;
			}
		} catch(e) {
			__support = false;
		}
	}

	return {
		support : __support,
		engine  : "userData",
		getItem : function(key) {
			if(__support) {
				var value = a.parser.json.parse(db.getAttribute(key));
				if(a.isNull(value)) {
					a.storage.__printGetErrorItem("userData", key);
					return null;
				}
				a.storage.__printGetItem("userData", key, value);
				return value;
			}
			return null;
		},
		setItem : function(key, value) {
			if(__support) {
				a.storage.__printSetItem("userData", key, value);
				db.setAttribute(key, a.parser.json.stringify(value));
				db.save(dbName);
				a.message.dispatch("a.storage.add", {
					key : key,
					value : value
				});
			}
		},
		removeItem : function(key) {
			if(__support) {
				a.storage.__printRemoveItem("userData", key);
				db.removeAttribute(key);
				db.save(dbName);
				a.message.dispatch("a.storage.remove", {
					key : key
				});
			}
		}
	};
})();



/**
 * @class flash
 * @extends a.storage.type
 *
 * flash external storage
*/
a.storage.type.flash = (function() {
	"use strict";

	var __support = false,
		__ready   = false,
		__id      = "flashstorage";

	/**
	 * Start flash and check availablility
	 *
	 * @param callback {Function | null} The callback function to call after loading
	*/
	function __startFlash(callback) {
		if(__support === false && __ready === false) {
			// Append to root an object for recieving flash
			var root = document.createElement("div");
			root.id = "flashstoragecontent";
			document.body.appendChild(root);

			var data = {
				id : __id,
				rootId : root.id,

				flashvars : {},
				params : {
					wmode: "transparent",
					menu: "false",
					scale: "noScale",
					allowFullscreen: "true",
					allowScriptAccess: "always"
				}
			};

			// Loading file
			a.loader.flash(a.url + "vendor/storage/flash/localStorage.swf", function(e) {
				__ready = true;

				var el = document.getElementById(data.id);

				if(el.testData() === true) {
					__support = true;
					el.setDatabase("a_flashStorage");
				}
				if(__support === true && a.isFunction(callback)) {
					callback(__support);
				}
			}, data);
		} else if(__support === true && a.isFunction(callback)) {
			callback(__support);
		}
	};

	return {
		support : function() {return __support;},
		ready : function() {return __ready;},
		engine : "flash",

		start : function(callback) {
			__startFlash(callback);
		},

		getItem : function(key) {
			this.start();
			if(__support === true) {
				var item = document.getElementById(__id).getData(key);
				if(a.isNull(item)) {
					a.storage.__printGetErrorItem("flash", key);
					return null;
				}
				a.storage.__printGetItem("flash", key, item);
				return item;
			}
		},

		setItem : function(key, value) {
			this.start();
			if(__support === true) {
				a.storage.__printSetItem("flash", key, value);
				document.getElementById(__id).setData(key, value);
			}
		},

		removeItem : function(key) {
			this.start();
			if(__support === true) {
				a.storage.__printRemoveItem("flash", key);
				return document.getElementById(__id).removeData(key);
			}
		}
	};
})();



/**
 * @class silverlight
 * @extends a.storage.type
 *
 * silverlight external storage
*/
a.storage.type.silverlight = (function() {
	"use strict";

	var __support = false,
		__ready   = false,
		__id      = "silverlightstorage";

	/**
	 * Start silverlight and check availablility
	 *
	 * @param callback {Function | null} The callback function to call after loading
	*/
	function __startSilverlight(callback) {
		if(__support === false && __ready === false) {
			// Append to root an object for recieving flash
			var root = document.createElement("div");
			root.id = "__silverlightstorage";
			document.body.appendChild(root);

			var data = {
				id : __id,
				rootId : root.id,

				params : [{
					name : "minRuntimeVersion",
					value : "2.0.31005.0"
				},{
					name : "autoUpgrade",
					value : "true"
				}]
			};

			// Loading file
			a.loader.silverlight(a.url + "vendor/storage/silverlight/silverlightStorage.xap", function(e) {
				__ready = true;

				var el = document.getElementById(data.id);
				if(el.Content.store.testData() === true) {
					__support = true;
				}
				if(__support === true && a.isFunction(callback)) {
					callback(__support);
				}
			}, data);
		} else if(__support === true && a.isFunction(callback)) {
			callback(__support);
		}
	};

	return {
		support : function() {return __support;},
		ready : function() {return __ready;},
		engine : "silverlight",

		start : function(callback) {
			__startSilverlight(callback);
		},

		getItem : function(key) {
			this.start();
			if(__support === true) {
				var item = document.getElementById(__id).Content.store.loadData(key);
				if(a.isNull(item) || item === "false") {
					a.storage.__printGetErrorItem("silverlight", key);
					return null;
				}
				var value = a.parser.json.parse(item);
				a.storage.__printGetItem("silverlight", key, value);
				return value;
			}
		},

		setItem : function(key, value) {
			this.start();
			if(__support === true) {
				a.storage.__printSetItem("silverlight", key, value);
				document.getElementById(__id).Content.store.saveData(key, a.parser.json.stringify(value));
			}
		},

		removeItem : function(key) {
			this.start();
			if(__support === true) {
				a.storage.__printRemoveItem("silverlight", key);
				document.getElementById(__id).Content.store.removeData(key);
			}
		}
	};
})();



/**
 * @class javafx
 * @extends a.storage.type
 *
 * javafx external storage
*/
a.storage.type.javafx = (function() {
	"use strict";

	var __support = false,
		__ready   = false,
		__id      = "javafxstorage";

	/**
	 * Start javaFX and check availablility
	 *
	 * @param callback {Function | null} The callback function to call after loading
	*/
	function __startJavaFX(callback) {
		if(__support === false && __ready === false) {
			var data = {
				code : "javafxstorage.Main",
				id : "javafxstorage"
			};

			// Loading file
			a.loader.javafx(a.url + "vendor/storage/javafx/JavaFXStorage.jar", function() {
				__ready = true;
				var t = document.getElementById("javafxstorage");

				if(t.Packages.javafxstorage.localStorage.testData() === true) {
					__support = true;
					el.setDatabase("a_javafxStorage");
				}
				
				if(__support === true && a.isFunction(callback)) {
					callback(__support);
				}
			}, data);
		} else if(__support === true && a.isFunction(callback)) {
			callback(__support);
		}
	}

	return {
		support : function() {return __support;},
		ready : function() {return __ready;},
		engine : "javafx",

		start : function(callback) {
			__startJavaFX(callback);
		},

		getItem : function(key) {
			this.start();
			if(__support === true) {
				var item = document.getElementById(__id).Packages.javafxstorage.localStorage.loadData(key);
				if(a.isNull(item) || item === "false") {
					a.storage.__printGetErrorItem("javafx", key);
					return null;
				}
				var value = a.parser.json.parse(item);
				a.storage.__printGetItem("javafx", key, value);
				return value;
			}
		},

		setItem : function(key, value) {
			this.start();
			if(__support === true) {
				a.storage.__printSetItem("javafx", key, value);
				document.getElementById(__id).Packages.javafxstorage.localStorage.saveData(key, a.parser.json.stringify(value));
			}
		},

		removeItem : function(key) {
			this.start();
			if(__support === true) {
				a.storage.__printRemoveItem("javafx", key);
				document.getElementById(__id).Packages.javafxstorage.localStorage.removeData(key);
			}
		}
	};
})();






/* *************************
  POPULATING DATA FOR TEMPORARY AND PERSIST
************************* */
// TEMPORARY STORE SEARCH
/**
 * @class temporary
 * @extends a.storage
 *
 * Select the best temp storage available
*/
a.storage.temporary = (function() {
	"use strict";

	var store = ["sessionStorage", "cookie", "memory"];
	for(var i=0, l=store.length; i<l; ++i) {
		var temp = store[i];
		if(a.storage.type[temp].support) {
			a.console.log("a.storage.temporary: choosing storage " + a.storage.type[temp].engine, 3);
			a.message.dispatch("a.storage.temporary.change", { engine : temp });
			return a.storage.type[temp];
		}
	}

	// Memory store should be always OK, so this should never arrive
	return null;
})();


// EXTERNAL STORE SEARCH
/**
 * @class external
 * @extends a.storage
 *
 * Select the best external storage available
*/
a.storage.external = (function() {
	var __started = false;

	/**
	 * Start the callback function if possible
	 *
	 * @param type {Object} The object to use for external
	 * @param callback {Function | null} The function to launch if a store has been found
	*/
	function __startCallback(type, callback) {
		a.storage.external.ready = type.ready;
		a.storage.external.support = type.support;
		a.storage.external.engine = type.engine;
		a.storage.external.getItem = type.getItem;
		a.storage.external.setItem = type.setItem;
		a.storage.external.removeItem = type.removeItem;

		if(a.isFunction(callback)) {
			callback();
		}
	};

	return {
		/**
		 * Start the external tool, try to find an available store
		 *
		 * @param callback {Function | null} The function to launch if a store has been found
		*/
		start : function(callback) {
			var silvt = a.storage.type.silverlight,
				flash = a.storage.type.flash,
				javax = a.storage.type.javafx;

			var cs = "a.storage.external: choosing storage ";

			// Loading silverlight
			silvt.start(function(svtSupport) {
				if(svtSupport) {
					a.console.log(cs + "silverlight", 3);
					__startCallback(silvt, callback);
				} else {
					// Loading flash
					flash.start(function(flashSupport) {
						if(flashSupport) {
							a.console.log(cs + "flash", 3);
							__startCallback(flash, callback);
						} else {
							javax.start(function(javaxSupport) {
								if(javaxSupport) {
									a.console.log(cs + "javafx", 3);
									__startCallback(javax, callback);
								} else {
									a.console.warn(cs + "NONE AVAILABLE", 3);
								}
							});
						}
					});
				}
			});
		}
	};
}());


// PERSISTENT STORE SEARCH
/**
 * @class persistent
 * @extends a.storage
 *
 * Select the best long term storage available
*/
a.storage.persistent = (function() {
	"use strict";

	var store = ["localStorage", "globalStorage", "userData", "cookie"];
	for(var i=0, l=store.length; i<l; ++i) {
		var temp = store[i];
		if(a.storage.type[temp].support) {
			a.console.log("a.storage.persistent: choosing storage " + a.storage.type[temp].engine, 3);
			a.message.dispatch("a.storage.persistent.change", { engine : temp });
			return a.storage.type[temp];
		}
	}

	// This one may append
	return null;
})();

if(a.storage.persistent == null) {
	a.storage.persistent = {};
	a.storage.persistent.support    = false;
	a.storage.persistent.engine     = function(){return "none";};
	a.storage.persistent.getItem    = function(){return null;};
	a.storage.persistent.setItem    = function(){};
	a.storage.persistent.removeItem = function(){};
}

// Now storage himself got same as persistent
a.storage.support    = a.storage.persistent.support;
a.storage.engine     = a.storage.persistent.engine;
a.storage.getItem    = a.storage.persistent.getItem;
a.storage.setItem    = a.storage.persistent.setItem;
a.storage.removeItem = a.storage.persistent.removeItem;