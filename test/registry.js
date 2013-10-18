var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Registry   = require("../src/registry");
var Service   = require("../src/service");

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
        testRoute("/", { services: [] }, done);
    });
    it("should register a service", function (done) {
        Registry.add.should.be.a.Function;
        var service = new Service({ name: "service1" });
        Registry.add(service);
        testRoute("/", { services: [ { name: "service1" } ] }, done);
    });
    it("should dynamically handle new services", function (done) {
        Registry.add(new Service({ prop1: "prop1Value" }));
        testRoute("/", { services: [
            { name: "service1" },
            { prop1: "prop1Value" }
        ]}, done);
    });
    it("should allow services to be cleared", function (done) {
        Registry.reset.should.be.a.Function;
        Registry.reset();
        testRoute("/", { services: [] }, done);
    });
    it("should allow services to be registered over HTTP", function (done) {
        var service = new Service({ name: "newService" });
        var request = supertest(Registry);
        request
            .post("/service")
            .set('Accept', 'application/json')
            .send(service.properties())
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                testRoute("/", { services: [ { name: "newService" } ] }, done);
            });
    });
});
