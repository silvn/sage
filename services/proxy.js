var Service = require(__dirname + '/../src/service.js');

var service = new Service();

service.get("/hello", function (req, res, next) {
    res.send({ message: "Hello World" });
});

module.exports = service;
