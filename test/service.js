var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Service   = require("../src/service");

function testMethod(method, done, expectBody) {
    var service = new Service();
    var server = service.server();
    expectBody = expectBody || { result: "yay" };
    var send = function (req, res) {
        res.send(expectBody);
    };
    service[method]('/apath', send);
    supertest(server)[method]('/apath')
        .end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            res.body.should.eql(expectBody);
            done();
        });
}

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
    it("should support GET methods", function (done) {
        testMethod('get', done);
    });
    it("should support POST methods", function (done) {
        testMethod('post', done);
    });
    it("should support PUT methods", function (done) {
        testMethod('put', done);
    });
    it("should support HEAD methods", function (done) {
        testMethod('head', done, {});
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

describe("Service.get", function () {
    var service = new Service();
    var server = service.server();
    it("should allow a new route with parameters", function (done) {
        service.get("/resource/:id", function (req, res) {
            req.params.id.should.equal("9722");
            res.send("Yes! " + req.params.id);
        });
        supertest(server).get("/resource/9722").end(
            function (err, res) {
                res.body.should.eql("Yes! 9722");
                done();
            }
        );
    });
})
