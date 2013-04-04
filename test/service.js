var supertest = require("supertest");
var express   = require("express");
var util      = require("util");

var Service   = require("../src/service");

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

describe("live service", function () {
    var service = new Service();
    it("should handle index route", function (done) {
        var server = service.server();
        supertest(server)
            .get('/')
            .expect(206)
            .end(function (err, res) {
                (err).should.be.null;
                res.status.should.equal(200);
                res.body.should.be.null; // FIXME: Should return something
                done();
            }
        );
    });
});