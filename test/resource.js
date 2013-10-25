var Resource = require("../src/resource");

describe("Resource", function () {
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
        var ExtendedResource = Resource.extend({ url: "http://cnn.com" });
        var resource = new ExtendedResource();
        resource.url().should.equal("http://cnn.com");
        ExtendedResource.url().should.equal("http://cnn.com");
    });
    it("should return a null URL when not specified in extend()", function () {
        var AResource = Resource.extend();
        [AResource.url()].should.be.null;
        [AResource.url()].should.be.defined;
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
        app.get("/cat", function (req, res) {
            res.send(200, { action: "meow" });
        });
        
        var server = http.createServer(app).listen(54321);
        it("should fetch a resource by URL", function (done) {
            var Cat = Resource.extend({ url: "http://0.0.0.0:54321/cat" });
            var cat = new Cat();
            cat.fetch().done(function () {
                this.property("action").should.equal("meow");
                done();
            });
        });
        it("should do nothing when no URL is defined", function (done) {
            var Dog = Resource.extend();
            var dog = new Dog({ name: "Caleb" });
            [dog.url()].should.be.null;
            dog.fetch().done(function () {
                this.property("name").should.equal("Caleb");
                done();
            });
        });
        after(function (done) {
            server.close();
            done();
        });
    });
});

