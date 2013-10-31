var extend      = require("./extend");
var Promise     = require("./promise");
var Revalidator = require("revalidator");
var Restify     = require("restify");
var URL         = require("url");
var _           = require("underscore");

(function (module) {
    "use strict";
    /* Special options parsed from the extend call, not instance properties
     */
    var RES_OPTIONS = ["url", "parse"];

    /**
     * @class Resource
     * A web resource. Properties and utilities for describing, operating on,
     * and managing data across web services.
     * 
     * A resource can be a simple container for properties with validation:
     * 
     *     @example
     *     var Cat = Resource.extend({
     *         breed: { type: "string" },
     *         lives: { type: "number" }
     *     });
     *     var cat = new Cat({ breed: "Siamese" });
     *     // Changed my mind...
     *     cat.property("breed", "Bengal"); // OK
     *     cat.property("lives", "Nine"); // NOT OK!
     * 
     * A resource can also be fetched remotely:
     * 
     *     @example
     *     var Cat = Resource.extend({ url: "http://catserver.com/cat/5" });
     *     var cat = new Cat();
     *     cat.fetch().done(function () {
     *         alert(this.properties())
     *     });
     * 
     * The URL itself can be an ERB-style template. Sage will inject the
     * current resource properties into the URL.
     * 
     * Data that is remotely fetched can also be specially parsed by providing
     * a `parse` function in the constructor:
     * 
     *     @example
     *     var Cat = Resource.extend({
     *         url: "http://catserver.com/cat/breed/<%= breed %>",
     *         fetch: function (data) {
     *             data.name = "Felix";
     *             return data;
     *         }
     *     });
     *     var cat = new Cat({ breed: "Cheshire" });
     *     cat.fetch().done(function () { alert(this.properties()); });
     * 
     * @constructor
     * Creates a resource.
     * 
     * @param {Object} properties A set of resource properties.
     *                 The constructor has some specially-handled properties:
     * @param {Function} properties.parse (optional)
     *        A parser of remotely-fetched data. Returns the parsed data;
     *        if null, the resource will remain untouched.
     * @param {Object} properties.parse.data The incoming remote data
     * @param {String} properties.url (optional)
     *        A plain URL or a URL template that will be interpolated on #fetch
     */
    function Resource(properties) {
        var name;
        for (name in properties) {
            if (properties.hasOwnProperty(name)) {
                this.property(name, properties[name]);
            }
        }
    }

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
     * @return {Function} return.done A handler for after the resource is
     *         fetched from the server.
     */
    Resource.prototype.fetch = function () {
        var self = this,
            promise = new Promise(this),
            url;
        if (self.url() === null) {
            try {
                promise.resolve(self.parse());
            } catch (exception) {
                promise.resolveFail(exception);
            }
        } else {
            var urlString = _.template(self.url())(self.properties());
            url = URL.parse(urlString);
            if (self.client === undefined) {
                self.client = Restify.createJsonClient({
                    url: URL.format({
                        host: url.host,
                        protocol: url.protocol
                    })
                });
            }
            self.client.get(url.path, function (err, req, res, obj) {
                try {
                    var parsed = self.parse(obj);
                    self.defaultParse(parsed);
                    promise.resolve(err, parsed);
                } catch (exception) {
                    promise.resolveFail(exception);
                }
            });
        }
        return promise;
    };

    /** @ignore */
    Resource.schema = function () { return {}; };

    /**
     * @method property
     * Gets or sets a property. If the property has a schema defined, then the
     * value is validated.
     * 
     * @param {String} name    The name of the property
     * @param value (optional) The value of the property
     * @return {Mixed} The value of the property
     * 
     * See {@link Resource#extend}
     */
    Resource.prototype.property = function (prop, value) {
        this.props = (this.props || {});
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

    /**
     * @method url
     * Returns the URL backing the resource.
     * @return {String}
     * @static
     */
    Resource.url = Resource.prototype.url = function () {
        return null;
    };

    /**
     * @method parse
     * Parses data into the resource.
     * @param {Object} data The JSON object to be parsed
     * @return {Object} A JSON object
     */
    Resource.parse = Resource.prototype.parse = function (data) {
        return data;
    };

    /** @ignore */
    Resource.prototype.defaultParse = function (parsed) {
        var key;
        for (key in parsed) {
            if (parsed.hasOwnProperty(key))
                this.property(key, parsed[key]);
        }
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
        }
        RES_OPTIONS.forEach(function (option) {
            if (args.hasOwnProperty(option)) {
                delete schema[option];
                if (typeof(args[option]) === "function") {
                    Extended[option] = Extended.prototype[option] =
                        args[option];
                } else {
                    Extended[option] = Extended.prototype[option] =
                    (function () {
                        var value = args[option];
                        return function () {
                            return value;
                        };
                    })();
                }
            }
        });
        Extended.schema = Extended.prototype.schema = function () {
            return schema;
        };
        return Extended;
    };

    module.exports = Resource;

})(module);