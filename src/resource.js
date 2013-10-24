var extend      = require("./extend");
var Revalidator = require("revalidator");

/**
 * @class Resource
 * A web resource
 * @constructor
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

/** @ignore */
Resource.schema = function () { return {}; };

/**
 * @method property
 * Gets or sets a property
 * 
 * @param {String} name    The name of the property
 * @param value (optional) The value of the property
 * @return {Mixed} The value of the property
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
Resource.extend = function (schema) {
    var Extended = extend.apply(Resource, {});
    schema = (schema || {});

    Extended.schema = Extended.prototype.schema =
        function () { return schema; };
    return Extended;
}

module.exports = Resource;