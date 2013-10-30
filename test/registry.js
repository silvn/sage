var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Service   = require("../src/service").logLevel("fatal");
var Registry  = require("../src/registry")();

var URL = "http://0.0.0.0:3156";

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
    before(function (done) {
        Registry.start({ port: 3156 });
        done();
    });
    beforeEach(function () {
        Registry.reset();
    });
    after(function (done) {
        Registry.stop().done(done);
    })
    it("should be an instance of Service", function () {
        Registry.should.be.an.instanceOf(Service);
    });
    it("should be a singleton", function () {
        var Registry2 = require("../src/registry")();
        Registry.should.equal(Registry2);
    });
    it("should return a default index route", function (done) {
        testRoute("/", { services: {} }, done);
    });
    it("should register a service", function (done) {
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
        var service = new Service({ name: "newService" });
        service.start({ port: 8484 });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                var services = {};
                services[URL + "/service/1"] = {
                    name: "newService",
                    url: "http://0.0.0.0:8484"
                };
                testRoute("/", { services: services }, function () {
                    service.stop(); done();
                });
            });
    });
    it("should generate new ID if one not specified", function (done) {
        var service = new Service({ name: "serviceName" });
        service.start({ port: 91919 });
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
                    name: "serviceName", url: service.url()
                };
                testRoute("/", { services: services }, function () {
                    service.stop();
                    done();
                });
            });
    });
    it("should return a dictionary of services", function (done) {
        addServicesToFind();
        Registry.services().should.eql({
            1: {
                name: "svc1",
                type: "car",
                url: "http://0.0.0.0:29991"
            },
            2: {
                name: "svc2",
                type: "social",
                url: "http://0.0.0.0:29992"
            },
            3: {
                name: "svc3",
                type: "car",
                url: "http://0.0.0.0:29993"
            }
        });
        done();
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
    function addService(props, port) {
        var svc = new Service(props);
        svc.start({ port: port });
        Registry.add(svc);
        svc.stop();
    }
    function addServicesToFind() {
        addService({ name: "svc1", type: "car"    }, 29991);
        addService({ name: "svc2", type: "social" }, 29992);
        addService({ name: "svc3", type: "car"    }, 29993);
    }
    describe("#find", function () {
        it("should return a service", function (done) {
            addServicesToFind(29991);
            var service = Registry.find("name", "svc1");
            service.should.be.an.Object;
            service.should.eql({
                name: "svc1", type: "car", url: "http://0.0.0.0:29991"
            });
            done();
        });
    });
    describe("#proxy", function () {
        it("should clone functionality of real Registry", function (done) {
            addServicesToFind(29995);
            Registry.proxy(URL).done(function (registry) {
                registry.should.not.equal(Registry);
                registry.find("name", "svc2").should.eql({
                    name: "svc2", type: "social", url: "http://0.0.0.0:29992"
                });
                done();
            });
        });
    });
});


describe("Registered service", function () {
    before(function (done) {
        Registry.start({ port: 3156 });
        done();
    });
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
        var service = new Service();
        service.start({ port: 19191 });
        supertest(Registry)
            .post("/service")
            .set('Accept', 'application/json')
            .send({ url: service.url() })
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                service.stop();
                done();
            });
    });
    it("should be pinged by the registry", function (done) {
        var service = new Service({ name: "Arby's" });
        service.start({ port: 55755 });
        Registry.add(service).done(function () {
            setTimeout(function () {
                service.registryURL().should.equal(URL);
                done();
            }, 150);
        });
    });
});
