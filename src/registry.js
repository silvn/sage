var Service = require(__dirname + "/service.js");

var Registry = new Service();

var services = [];

Registry.get("/", function (req, res, next) {
    var sProps = services.map(function (s) { return s.properties(); });
    res.send({ services: sProps });
    next();
});

Registry.post("/service", function (req, res, next) {
    var body = req.body;
    services.push({
        properties: function () { return body; }
    });
    res.send(200, { message: "Service was added successfully" });
});

Registry.add = function (service) {
    services.push(service);
};

Registry.reset = function () {
    services = [];
};

module.exports = Registry;