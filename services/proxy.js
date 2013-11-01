var Sage = require("../src/sage.js");

var service = new Sage.Service({
    initialize: function () {
        this.registry().done(function (registry) {
        });
        var Car = Sage.Resource.extend({
            make:  { type: "string" },
            model: { type: "string" },
            year:  { type: "number" }
        })
        service.resource("car", Car, { listProperties: ["model"] });
        var cars = [
            { make: "Toyota",  model: "Prius",  year: 2005 },
            { make: "Nissan",  model: "Stanza", year: 2008 },
            { make: "Ford",    model: "Taurus", year: 1998 },
            { make: "Porsche", model: "929",    year: 1983 }
        ];
        cars.forEach(function (car) {
            service.client().post("/car", car, function () {});
        });
    }
});

service.get("/hello", function (req, res, next) {
    res.send({ message: "Hello World" });
});

module.exports = service;
