var extend      = require("./extend");
var Revalidator = require("revalidator");
var Restify     = require("restify");
var URL         = require("url");

/* Special options parsed from the extend call, not instance properties
 */
var RES_OPTIONS = ["url", "parse"];

/**
 * @class Resource
 * A web resource.
 * 
 * @constructor
 * Creates a resource.
 * 
 * @param {Object} properties A set of initial properties
 */
function Resource(properties) {
    this.props = {};
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            this.property(name, properties[name]);
        }
    }
};

/**
 * @method
 * Returns the schema that describes the resource.
 * @return {Object} A schema object
 */
Resource.prototype.schema = function () {
    return this.schema;
};

/**
 * @method fetch
 * Fetches the resource from a remote service.
 * @return {Object} A promise
 * @return {Function} return.done A handler for after the resource is fetched
 *                                from the server.
 */
Resource.prototype.fetch = function () {
    var self = this;
    self.doneFetchCallback = undefined;
    var promise = {};

    if (self.url() === null) {
        var parsed = self.parse();
        promise.done = function (callback) {
            callback.call(self, parsed);
        }
    } else {
        var url = URL.parse(self.url());
        promise.done = function (callback) {
            self.doneFetchCallback = callback;
        };
        if (self.client === undefined) {
            self.client = Restify.createJsonClient({
                url: URL.format({
                    host: url.host,
                    protocol: url.protocol
                })
            });
        }
    
        self.client.get(url.path, function (err, req, res, obj) {
            var parsed = self.parse(obj);
            for (var key in parsed) {
                self.property(key, parsed[key]);
            }
            self.doneFetchCallback(err, parsed);
        });
    }
    return promise;
};

/** @ignore */
Resource.schema = function () { return {}; };

/**
 * @method property
 * Gets or sets a property. If the property has a schema defined, then the value
 * is validated.
 * 
 * @param {String} name    The name of the property
 * @param value (optional) The value of the property
 * @return {Mixed} The value of the property
 * 
 * See {@link Resource#extend}
 */
Resource.prototype.property = function (prop, value) {
    if (value !== undefined) {
        var schema = this.schema();
        if (schema[prop] !== undefined) {
            var test = {}; test[prop] = value;
            var valid = Revalidator.validate(
                test, { properties: schema }
            );
            if (!valid.valid) {
                var errs = [];
                valid.errors.forEach(function (e) {
                    errs.push(e.property + " " + e.message);
                });
                throw new Error(errs.join("\n"));
            }
        }
        this.props[prop] = value;
    }
    return this.props[prop];
};

/**
 * @method
 * Gets the set of service properties.
 * 
 * @return The set of properties
 */
Resource.prototype.properties = function () {
    return this.props;
};

Resource.url = Resource.prototype.url = function () {
    return null;
};

Resource.parse = Resource.prototype.parse = function (data) {
    return data;
};


/**
 * @method extend
 * Extends the resource by specifying a validating schema.
 * 
 * @param {Object} schema       The schema to use
 * @param {String} schema.key   The name of a property
 * @param {Object} schema.value Descriptor of the property
 * 
 * @return {Resource} the extended resource
 * 
 * @static
 */
Resource.extend = function (args) {
    args = (args || {});
    var Extended = extend.apply(this, arguments);
    var schema = {};
    for (var a in args) {
        if (args.hasOwnProperty(a) && typeof(args[a]) === "object")
            schema[a] = args[a];
    };
    RES_OPTIONS.forEach(function (option) {
        if (args.hasOwnProperty(option)) {
            schema[option] = undefined;
            if (typeof(args[option]) === "function") {
                Extended[option] = Extended.prototype[option] = args[option];
            } else {
                Extended[option] = Extended.prototype[option] = (function () {
                    var value = args[option];
                    return function () {
                        return value;
                    }
                })();
            }
        }
    });
    Extended.schema = Extended.prototype.schema = function () {
        return schema;
    };
    return Extended;
}

module.exports = Resource;