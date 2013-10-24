var Resource = require("./resource");

/**
 * @class Collection
 * A collection of {@link Resource}s.
 * @constructor
 */
function Collection(params) {
    params = (params || {});
    var items = [];
    var protoRes = Object;
    if (params.resource !== undefined) {
        protoRes = params.resource;
    }

    /**
     * @method add
     * Adds a resource to the collection
     * @param {Resource} resource The resource to add
     * @chainable
     */
    this.add = function (resource) {
        if (!(resource instanceof protoRes)) {
            throw new Error(
                "Collection can only contain resources of type " +   
                protoRes
            );
        }
        items.push(resource);
        return this;
    }

    /**
     * @method size
     * Gets the number of items in the collection
     * @return {Number}
     */
    this.size = function () {
        return items.length;
    };

    /**
     * @method remove
     * Removes a resource from the collection
     * @param {Resource} resource The resource to remove
     * @return {Resource}
     * @throws {Error}
     */
    this.remove = function (resource) {
        for (var i = 0; i < items.length; i++) {
            if (items[i] == resource) {
                var removed = items.splice(i, 1);
                return removed[0];
            }
        }
        throw new Error("Cannot remove non-member resource");
    }
}

Collection.prototype = new Resource();

module.exports = Collection;