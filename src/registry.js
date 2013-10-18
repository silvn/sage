var Service = require(__dirname + "/service.js");

var Registry = new Service();

var services = [];

Registry.get("/", function (req, res, next) {
    var sProps = services.map(function (s) { return s.properties() });
    res.send({ services: sProps });
    next();
});

Registry.add = function (service) {
    services.push(service);
}

module.exports = Registry;