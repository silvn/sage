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
        service.listen(5555);
        Registry.add(service);
        var services = {};
        services[URL + "/service/5"] = {
            id: 5, name: "service1", url: "http://0.0.0.0:5555"
        };
        testRoute("/", { services: services }, done);
    });
    it("should dynamically handle new services", function (done) {
        var service = new Service({ id: 3, name: "service1" });
        service.listen(5556);
        Registry.add(service);
        var services = {};
        services[URL + "/service/3"] = {
            id: 3, name: "service1", url: "http://0.0.0.0:5556"
        };
        testRoute("/", { services: services }, function () {
            var service2 = new Service({ id: 4, prop1: "prop1Value" });
            service2.listen(5557);
            Registry.add(service2);
            services[URL + "/service/4"] = {
                id: 4, prop1: "prop1Value", url: "http://0.0.0.0:5557"
            };
            testRoute("/", { services: services }, done);
        });
    });
    it("should allow services to be cleared", function (done) {
        Registry.reset.should.be.a.Function;
        Registry.reset();
        testRoute("/", { services: [] }, done);
    });
    it("should allow services to be registered over HTTP", function (done) {
        var service = new Service({ name: "newService", url: "myURL" });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                var services = {};
                services[URL + "/service/1"] = {
                    name: "newService", url: "myURL"
                };
                testRoute("/", { services: services }, done);
            });
    });
    it("should generate new ID if one not specified", function (done) {
        var service = new Service({ name: "serviceName", url: "someURL" });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                res.body.id.should.equal(1);
                var services = {};
                services[URL + "/service/1"] = {
                    name: "serviceName", url: "someURL"
                };
                testRoute("/", { services: services }, done);
            });
    });
    it("should describe a service by name", function (done) {
        var props = { name: "wendys", fries: "curly" };
        var service = new Service(props);
        service.listen(5558);
        Registry.add(service);
        var services = {};
        props.url = "http://0.0.0.0:5558";
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

describe("Registered service", function () {
    beforeEach(function () {
        Registry.reset();
    });
    it("should have an index URL", function (done) {
        var service = new Service({ color: "blue" });
        service.should.be.ok;
        service.listen(5559);
        Registry.add(service);
        supertest(Registry).get("/service/1").end(function (err, res) {
            res.body.url.should.equal("http://0.0.0.0:5559");
            done();
        });
    });
    it("must be listening, with JavaScript API", function (done) {
        var service = new Service({ color: "blue" });
        service.should.be.ok;
        (function () { Registry.add(service) }).should
            .throw("Service is not listening");
        service.listen(5560);
        (function () { Registry.add(service) }).should.not.throw();
        done();
    });
    it("should return 400 when no URL prop over HTTP", function (done) {
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send({ cat: "meow" })
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(400);
                res.body.should.eql({
                    code: "InvalidContent",
                    message: "URL property is not defined"
                });
                done();
            });
    });
    it("should be ok when URL prop defined over HTTP", function (done) {
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send({ url: "ok not really a URL but still" })
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                done();
            });
    });
});
