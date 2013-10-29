var Promise = require("../src/promise");

describe("Promise", function () {
    it("should call done when resolved", function (done) {
        var promise = new Promise();
        promise.done(function (val) {
            val.should.equal("a new beginning");
            done();
        });
        promise.resolve("a new beginning");
    });
    it("should call done() when defined even after resolve", function (done) {
        var promise = new Promise();
        promise.resolve();
        promise.done(function () {
            should.be.ok;
            done();
        });
    });
    it("should accept a context", function (done) {
        var myObject = {};
        var another = {};
        var promise = new Promise(myObject);
        promise.done(function () {
            this.should.equal.myObject;
            this.should.not.equal.another;
            done();
        });
        promise.resolve();
    });
    it("shouldn't call fail() on successful resolve", function (done) {
        var promise = new Promise();
        promise.fail(function () {
            should.fail("Shouldn't get here");
        }).done(function () {
            should.be.ok;
            done();
        }).resolve();
    });
});