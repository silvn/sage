var Collection = require("../src/collection");
var Resource   = require("../src/resource");

describe("Collection", function () {
    var collection = new Collection();
    var resource   = new Resource();
    it("should be itself a Resource", function () {
        collection.should.be.instanceof(Resource);
        collection.schema.should.be.a.Function;
    });
    it("should have chainable methods", function () {
        collection.add(new Object()).should.equal(collection);
    });
    it("should allow adding and counting of elements", function () {
        collection.add(resource);
        collection.add(new Object());
        collection.size().should.equal(3);
    });
    it("should allow removal of objects", function () {
        var removed = collection.remove(resource);
        collection.size().should.equal(2);
    });
    it("should throw when trying to remove non-member", function () {
        (function () { collection.remove(new Object()); }).should.throw();
    });
    it("should accept a resource as a constructor argument", function () {
        var collection = new Collection({ resource: new Resource() });
    });
});
