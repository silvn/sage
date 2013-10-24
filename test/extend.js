var extend = require("../src/extend");

describe("extend", function () {
    it("should be a function", function () {
        extend.should.be.a.Function;
    });
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
    it("should preserve the super's constructor", function () {
        var value = undefined;
        function A(color) { value = color; }
        var B = extend.call(A, {});
        var b = new B("blue");
        value.should.equal("blue");
    });
});