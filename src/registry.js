var Service = require(__dirname + "/service.js");

var Registry = new Service();

var services = {};
var identifier = 1;

Registry.get("/", function (req, res, next) {
    var json = {};
    for (var id in services) {
        var service = services[id];
        json[Registry.url() + "/service/" + id] = service;
    }
    res.send({ services: json });
    next();
});

Registry.get("/service/:id", function (req, res, next) {
    var id = req.params.id;
    var service = services[id];
    if (service !== undefined) {
        res.send(service);
    } else {
        res.send(404, {
            message: "Service " + id + " is not registered"
        });
    }
});

Registry.post("/service", function (req, res, next) {
    var body = req.body;
    var id = Registry.add(body);
    res.send(200, {
        message: "Service was added successfully",
        id: id
    });
});

Registry.add = function (service) {
    var id, props;
    if (service instanceof Service) {
        id = service.property("id");
        props = service.properties();
    } else {
        id = service.id;
        props = service;
    }
    if (id === undefined) {
        id = identifier++;
    }
    services[id] = props;
    return id;
};

Registry.reset = function () {
    services = {};
    identifier = 1;
};

module.exports = Registry;