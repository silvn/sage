var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Registry   = require("../src/registry");
var Service   = require("../src/service");
Registry.listen(34567);

var URL = "http://0.0.0.0:34567"

function testRoute(route, body, done) {
    supertest(Registry).get(route).end(function (err, res) {
        [err].should.be.null;
        if (res.status !== 200) {
            console.dir(res);
        }
        res.status.should.equal(200);
        res.body.should.eql(body);
        done();
    });
}

describe("registry", function () {
    beforeEach(function () {
        Registry.reset();
    });
    it("should be a valid object", function () {
        Registry.should.be.an.Object;
    });
    it("should be an instance of Service", function () {
        Registry.should.be.an.instanceOf(Service);
    });
    it("should be a singleton", function () {
        var Registry2 = require("../src/registry");
        Registry.should.equal(Registry2);
    });
    it("should return a default index route", function (done) {
        testRoute("/", { services: {} }, done);
    });
    it("should register a service", function (done) {
        Registry.add.should.be.a.Function;
        var service = new Service({ id: 5, name: "service1" });
        Registry.add(service);
        var services = {};
        services[URL + "/service/5"] = { id: 5, name: "service1" };
        testRoute("/", { services: services }, done);
    });
    it("should dynamically handle new services", function (done) {
        Registry.add(new Service({ id: 3, name: "service1" }));
        var services = {};
        services[URL + "/service/3"] = { id: 3, name: "service1" };
        testRoute("/", { services: services }, function () {
            Registry.add(new Service({ id: 4, prop1: "prop1Value" }));
            services[URL + "/service/4"] = { id: 4, prop1: "prop1Value" };
            testRoute("/", { services: services }, done);
        });
    });
    it("should allow services to be cleared", function (done) {
        Registry.reset.should.be.a.Function;
        Registry.reset();
        testRoute("/", { services: [] }, done);
    });
    it("should allow services to be registered over HTTP", function (done) {
        var service = new Service({ name: "newService" });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                var services = {};
                services[URL + "/service/1"] = { name: "newService" };
                testRoute("/", { services: services }, done);
            });
    });
    it("should generate new ID if one not specified", function (done) {
        var service = new Service({ name: "serviceName" });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                res.body.id.should.equal(1);
                var services = {};
                services[URL + "/service/1"] = { name: "serviceName" };
                testRoute("/", { services: services }, done);
            });
    });
    it("should describe a service by name", function (done) {
        var props = { name: "wendys", fries: "curly" };
        var service = new Service(props);
        Registry.add(service);
        var services = {};
        services[URL + "/service/1"] = props;
        testRoute("/", { services: services }, function () {
            testRoute("/service/1", props, done);
        });
    });
    it("should get 404 if service not found", function (done) {
        supertest(Registry).get("/service/toothfairy").end(function (err, res) {
            [err].should.be.null;
            res.status.should.equal(404);
            done();
        });
    });
});
