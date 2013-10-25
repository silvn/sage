var Collection = require("../src/collection");
var Resource   = require("../src/resource");

describe("Collection", function () {
    var collection = new Collection();
    var resource   = new Resource();
    it("should be itself a Resource", function () {
        collection.should.be.instanceof(Resource);
        collection.schema.should.be.a.Function;
    });
    it("should have chainable methods", function () {
        collection.add(new Resource()).should.equal(collection);
    });
    it("should allow adding and counting of elements", function () {
        collection.add(resource);
        collection.add(new Resource());
        collection.size().should.equal(3);
    });
    it("should allow retrieval of resources", function () {
        collection.get(0).should.eql(new Resource());
    });
    it("should allow removal of objects", function () {
        var removed = collection.remove(resource);
        collection.size().should.equal(2);
    });
    it("should throw when trying to remove non-member", function () {
        (function () { collection.remove(new Resource()); }).should.throw();
    });
    it("should accept a resource as a constructor argument", function () {
        var Color = Resource.extend({
            name: { type: "string" }
        });
        var collection = new Collection({ resource: Color });
        collection.add(new Color()).should.be.ok;
        collection.size().should.equal(1);
        (function () { collection.add(new Resource()); }).should.throw();
    });
    it("should set and get properties", function () {
        collection.property("foo", "bar").should.be.ok;
        collection.property("foo").should.equal("bar");
    });
    describe("#fetch()", function () {
        var app  = require("express")();
        var http = require("http");
        app.get("/cats", function (req, res) {
            res.send(200, [
                { id: "cat0001", name: "Felix"    },
                { id: "cat0053", name: "Garfield" },
            ]);
        });
        var server = http.createServer(app).listen(55555);
        it("should fetch a collection by URL", function (done) {
            var Cats = Collection.extend({ url: "http://0.0.0.0:55555/cats" });
            var cats = new Cats();
            cats.fetch().done(function () {
                this.size().should.equal(2);
                var cat1 = this.get(0);
                var cat2 = this.get(1);
                cat1.property("name").should.equal("Felix");
                cat2.property("name").should.equal("Garfield");
                done();
            })
        });
        it("should fetch on typed Resources", function (done) {
            var Cat = Resource.extend({ hairball: { type: "string" }});
            var Cats = Collection.extend({
                url: "http://0.0.0.0:55555/cats",
            });
            var cats = new Cats({ resource: Cat });
            cats.fetch().done(function () {
                this.size().should.equal(2);
                done();
            });
        })
        after(function (done) {
            server.close();
            done();
        });
    });
});
