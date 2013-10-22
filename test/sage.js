var Sage = require("../src/sage");

describe("Sage", function () {
    it("should be an object", function () {
        Sage.should.be.an.Object;
    });
    it("should export Sage classes", function () {
        Sage.Service.should.be.a.Function;
        Sage.Resource.should.be.a.Function;
        Sage.Registry.should.be.an.Object;
    });
});