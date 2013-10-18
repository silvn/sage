var Service = require(__dirname + "/service.js");

var Registry = new Service();

var services = [];

Registry.get("/", function (req, res, next) {
    res.send({ services: services });
    next();
});

Registry.get("/service/:name", function (req, res, next) {
    var name = req.params.name;
    for (var i = 0; i < services.length; i++) {
        if (services[i].name == name) {
            res.send(services[i]);
            return;
        }
    }
    res.send(404, {
        message: "Service " + name + " is not registered"
    });
});

Registry.post("/service", function (req, res, next) {
    var body = req.body;
    services.push(body);
    res.send(200, { message: "Service was added successfully" });
});

Registry.add = function (service) {
    services.push(service.properties());
};

Registry.reset = function () {
    services = [];
};

module.exports = Registry;