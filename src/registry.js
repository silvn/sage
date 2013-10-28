var Service = require(__dirname + "/service.js").logLevel("fatal");

/**
 * @class Registry
 * Describes a set of registered services.
 * 
 * @extends Service
 * @singleton
 */
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
        next(new Service.ResourceNotFoundError(
            "Service " + id + " is not registered"));
    }
});

Registry.post("/service", function (req, res, next) {
    var id, body = req.body;
    try {
        id = Registry.add(body);
    } catch (err) {
        return next(new Service.InvalidContentError(err.message));
    }
    res.send(200, {
        message: "Service was added successfully",
        id: id
    });
});

Registry.add = function (service) {
    var id, props;
    if (service instanceof Service) {
        if (service.listening() === false) {
            throw new Error("Service is not listening");
        }
        id = service.property("id");
        props = service.properties();
        props.url = service.url();
    } else {
        if (service.url === undefined) {
            throw new Error("URL property is not defined");
        }
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