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
    it("should allow multiple done() callbacks", function (done) {
        var called = 0;
        var promise = new Promise();
        promise.done(function (val) {
            called += val;
        }).done(function (val) {
            called += val;
            called.should.equal(2);
            done();
        });
        promise.resolve(1);
    });
    it("should allow multiple fail() callbacks", function (done) {
        var called = 0;
        var promise = new Promise();
        promise.fail(function (val) {
            called += val;
        }).fail(function (val) {
            called += val;
            called.should.equal(2);
            done();
        });
        promise.resolveFail(1);
    })
});