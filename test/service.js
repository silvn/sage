var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Service   = require("../src/service");
var Resource  = require("../src/resource");

function testMethod(method, done, expectBody) {
    var service = new Service();
    expectBody = expectBody || { result: "yay" };
    var send = function (req, res) {
        res.send(expectBody);
    };
    service[method]('/apath', send);
    supertest(service)[method]('/apath')
        .end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            res.body.should.eql(expectBody);
            done();
        });
}

describe("Service", function () {
    it("should be a function", function () {
        Service.should.be.a.Function;
    });
    it("should allow inheritance", function () {
        var SpecificService = Service.extend({
            foo: function () {}
        });
        var service = new SpecificService();
        service.should.be.an.instanceOf(Service);
        service.foo.should.be.a.Function;
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
    it("should allow routes to be overloaded", function (done) {
        var service = new Service();
        service.get("/", function (req, res) {
            res.send("Yay overridden!");
        });
        supertest(service).get("/").end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            res.body.should.equal("Yay overridden!");
            done();
        });
    });
    it("should allow user properties in constructor", function () {
        var service = new Service({ name: "namedService" });
        service.property("name").should.equal("namedService");
    });
    it("should allow properties to be defined a la carte", function () {
        var service = new Service();
        service.property("prop1", "propValue");
        service.property("prop1").should.equal("propValue");
    });
    it("should return all properties", function () {
        var service = new Service({ p1: "v1", p2: "v2" });
        service.properties().should.eql({ p1: "v1", p2: "v2" });
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
        lService.listen = function (port) {
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

describe("Basic HTTP API", function () {
    var service = new Service();
    var request = supertest(service);
    it("should handle GET", function (done) {
        request.get('/').end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            res.body.should.be.null; // FIXME: Should return something
            done();
        });
    });
    it("should handle HEAD", function (done) {
        request.head('/').end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            done();
        });
    });
});

describe("Resource API", function () {
    var service = new Service();
    service.listen(9876);
    var URL = "http://0.0.0.0:9876";
    it("should describe resources", function (done) {
        service.resource("protein", new Resource());
        service.resource("baseball", new Resource());
        supertest(service).get("/").end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(200);
            res.body.should.eql({
                resources: {
                    "http://0.0.0.0:9876/protein": {},
                    "http://0.0.0.0:9876/baseball": {}
                }
            });
            done();
        });
    });
});

describe("Service.get", function () {
    var service = new Service();
    it("should allow a new route with parameters", function (done) {
        service.get("/resource/:id", function (req, res) {
            req.params.id.should.equal("9722");
            res.send("Yes! " + req.params.id);
        });
        supertest(service).get("/resource/9722").end(
            function (err, res) {
                res.body.should.eql("Yes! 9722");
                done();
            }
        );
    });
});