var extend = require("../src/extend");

describe("extend", function () {
    it("should allow extending classes", function () {
        function A() { this.unextended = function () {} };
        A.prototype.f1 = function () {};
        var B = extend.call(A, { f2: function () {} });
        var a = new A();
        var b = new B();
        a.f1.should.be.a.Function;
        b.f1.should.be.a.Function;
        b.f2.should.be.a.Function;
        a.unextended.should.be.a.Function;
        [b.undextended].should.be.undefined;
    });
    it("should preserve the base constructor", function () {
        var value = undefined;
        function A(color) { value = color; }
        var B = extend.call(A, {});
        var b = new B("blue");
        value.should.equal("blue");
        b.should.be.instanceof(A);
        b.should.be.instanceof(B);
    });
    it("should allow overriding the constructor", function () {
        function A(color) { this.value = "blue" };
        var B = extend.call(A, {
            constructor: function () { this.value = "green" }
        });
        var a = new A();
        var b = new B();
        a.value.should.equal("blue");
        b.value.should.equal("green");
    });
    it("should allow extending of the extended class", function () {
        function A() {};
        A.prototype.x = function () {};
        var B = extend.call(A, { y: function () {} });
        var C = extend.call(B, { z: function () {} });
        var c = new C();
        c.z.should.be.a.Function;
        c.y.should.be.a.Function;
        c.x.should.be.a.Function;
    });
});