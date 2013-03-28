var Service = require("../src/service");

describe("service", function () {
    it("should be a function", function () {
        Service.should.be.a("function");
    });
    it("should allow inheritance", function () {
        var SpecificService = Service.extend({
            foo: function () {}
        });
        var service = new SpecificService();
        service.should.be.an.instanceOf(Service);
        service.foo.should.be.a("function");
    });
});