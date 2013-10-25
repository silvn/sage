var Resource = require("../src/resource");

describe("Resource", function () {
    it("should be a function", function () {
        Resource.should.be.a.Function;
    });
    it("should allow extending", function () {
        Resource.extend.should.be.Function;
        var ExtendedResource = Resource.extend();
        (new ExtendedResource()).should.be.instanceof(Resource);
    });
    it("should support schema properties", function () {
        var Dog = Resource.extend({ breed: { type: "string" } });
        var dog = new Dog();
        dog.property("breed", "Schnauzer").should.be.ok;
        dog.property("breed").should.equal("Schnauzer");
        dog.properties().should.eql({ breed: "Schnauzer" });
    });
    it("should still allow untyped properties", function () {
        var resource = new Resource({ param1: 5 });
        resource.property("param1").should.equal(5);
    });
    it("should show all properties at once", function () {
        var Dog = Resource.extend({ breed: { type: "string" }});
        var dog = new Dog({ breed: "Lab", name: "Leo" });
        dog.properties().should.eql({
            breed: "Lab",
            name:  "Leo"
        });
    });
    it("should handle URL as an option to extend", function () {
        var RemoteResource = Resource.extend({ url: "http://cnn.com" });
        RemoteResource.url().should.equal("http://cnn.com");
    });
    it("should throw an error on invalid data", function () {
        var Cat = Resource.extend({
            food: { type: "string" }
        });
        var cat = new Cat();
        (function () { cat.property("food", 5); })
            .should.throw("food must be of string type");
    });
    it("should have a static schema function", function () {
        (new Resource()).schema.should.be.a.Function;
        var Mouse = Resource.extend({
            weight: { type: "number" }
        });
        var mouse = new Mouse();
        mouse.schema().should.eql({
            weight: { type: "number" }
        });
        Mouse.schema.should.equal(mouse.schema);
    });
    it("should return an empty schema on the base class", function () {
        Resource.schema.should.be.a.Function;
        Resource.schema().should.eql({});        
    });
    describe("#fetch()", function () {
        var app  = require("express")();
        var http = require("http");
        app.get("/", function (req, res) {
            res.send(200, { action: "meow" });
        });
        var server = http.createServer(app).listen(54321);
        it("should fetch a resource by URL", function (done) {
            var Cat = Resource.extend({
                url: "http://0.0.0.0:54321"
            });
            var cat = new Cat();
            cat.fetch().done(function () {
                this.property("action").should.equal("meow");
                done();
            });
        });
        after(function (done) {
            server.close();
            done();
        });
    });
});

