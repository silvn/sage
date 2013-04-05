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
    it("should 'listen' to a specified port", function (done) {
        var lService = new Service();
        lService.server().listen = function (port) {
            port.should.equal(7000);
            done();
        };
        lService.start({ port: 7000 }).should.be.ok;
        lService.stop();
    });
    it("should complain on already-started service", function () {
        service.start({ port: 7000 });
        (function () { service.start({ port: 7000 }); }).should.throw();
        service.stop();
    });
});

describe("Service.stop()", function () {
    var service = new Service();
    it("should fail on unstarted service", function () {
        (function () { service.stop(); }).should.throw();
    });
    it("should work when service started", function () {
        service.start({ port: 7000 });
        service.stop().should.be.ok;
    });
});

describe("Index route", function () {
    var service = new Service();
    var server = service.server();
    it("should handle GET", function (done) {
        supertest(server)
            .get('/')
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                res.body.should.be.null; // FIXME: Should return something
                done();
            }
        );
    });
    it("should handle HEAD", function (done) {
        supertest(server)
            .head('/')
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                done();
            }
        );
    });
});