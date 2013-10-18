var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Registry   = require("../src/registry");
var Service   = require("../src/service");

function testRoute(route, body, done) {
    supertest(Registry).get(route).end(function (err, res) {
        [err].should.be.null;
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
    })
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
});
