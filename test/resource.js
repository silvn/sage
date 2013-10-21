var Resource = require("../src/resource");

describe("Resource", function () {
    it("should be a function", function () {
        Resource.should.be.a.Function;
    });
    it("should define dynamic properties in constructor", function () {
        var dog = new Resource({ type: { type: "any" } });
        dog.type("Schnauzer").should.be.ok;
        dog.type().should.equal("Schnauzer");
    });
    it("should throw an error on invalid data", function (done) {
        var cat = new Resource({
            food: { type: "string" }
        });
        (function () { cat.food(5) })
            .should.throw("food must be of string type");
        done();
    });
});