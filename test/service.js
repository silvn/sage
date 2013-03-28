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
    it("should allow normal instantiation", function () {
        var service = new Service();
        service.should.be.an.instanceOf(Service);
    });
});

describe("Service.start()", function () {
    var service = new Service();
    it("should fail with no argument", function () {
        (function () { service.start(); }).should.throw();
        (function () { service.start(7000); }).should.throw();
    });
    it("should work with a specified port", function () {
        service.start({ port: 7000 }).should.be.ok;
    });
});