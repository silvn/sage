var Collection = require("../src/collection");
var Resource   = require("../src/resource");

describe("Collection", function () {
    it("should be a function", function () {
        Collection.should.be.a.Function;
    });
    it("should allow adding and counting of elements", function () {
        var collection = new Collection();
        collection.add(new Object());
        collection.add(new Object());
        collection.size().should.equal(2);
    });
    it("should have chainable methods", function () {
        var collection = new Collection();
        collection.add(new Object()).should.equal(collection);
    });
    it("should accept a resource as a constructor argument", function () {
        var collection = new Collection({ resource: new Resource() });
    });
});