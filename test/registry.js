var supertest = require("supertest");
var express   = require("express");
var util      = require("util");
var async     = require("async");

var Registry   = require("../src/registry");
var Service   = require("../src/service");

describe("registry", function () {
    it("should be a valid object", function () {
        Registry.should.be.an.Object;
    });
    it("should be an instance of Service", function () {
        Registry.should.be.an.instanceOf(Service);
    })
    it("should return a default index route", function (done) {
        supertest(Registry)
            .get('/')
            .end(function (err, res) {
                [err].should.be.null;
                res.status.should.equal(200);
                res.body.should.eql({
                    services: []
                });
                done();
            }
        );
    });
});
