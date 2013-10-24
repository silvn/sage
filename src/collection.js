/**
 * @class Collection
 * A collection of {@link Resource}s.
 * @constructor
 */
function Collection(params) {
    var items = [];
    /**
     * @method add
     * Adds a resource to the collection
     * @param {Resource} resource The resource to add
     * @chainable
     */
    this.add = function (resource) {
        items.push(resource);
        return this;
    };
    
    /**
     * @method size
     * Gets the number of items in the collection
     */
    this.size = function () {
        return items.length;
    };
}

module.exports = Collection;