var Service = require("../src/service.js");

var service = new Service({
    initialize: function () {
        this.registry().done(function (registry) {
            console.log("Got registry", registry);
        });
        console.log("Hello?");
    }
});

service.get("/hello", function (req, res, next) {
    res.send({ message: "Hello World" });
});

module.exports = service;
