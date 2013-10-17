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
});
