var Revalidator = require("revalidator");

/**
 * @class Resource
 * A web resource
 * @constructor
 */
function Resource(properties) {
    var props = {};
    properties = (properties || {});

    for (var prop in properties) {
        if (properties.hasOwnProperty(prop)) {
            this[prop] = function (val) {
                if (val !== undefined) {
                    props[prop] = val;
                    var valid = Revalidator.validate(
                        props, { properties: properties }
                    );
                    if (!valid.valid) {
                        props[prop] = undefined;
                        var errs = [];
                        valid.errors.forEach(function (e) {
                            errs.push(e.property + " " + e.message);
                        });
                        throw new Error(errs.join("\n"));
                    }
                }
                return props[prop];
            }
        }
    }

    /**
     * @method
     * Returns the schema that describes the resource.
     * @return {Object} A schema object
     */
    this.schema = function () {
        return properties;
    }
};

module.exports = Resource;