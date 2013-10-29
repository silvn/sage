var Service = require("./service");
var Promise = require("./promise");
var Restify = require("restify");

/**
 * @class Registry
 * Describes a set of registered services.
 * 
 * @extends Service
 * @singleton
 */
function createRegistry(params) {
    var registry = new Service();
    var services = {};
    if (params !== undefined) {
        services = params.services;
    }
    var identifier = 1;

    registry.get("/", function (req, res, next) {
        var json = {};
        for (var id in services) {
            var service = services[id];
            json[registry.url() + "/service/" + id] = service;
        }
        res.send({ services: json });
        next();
    });

    registry.get("/service/:id", function (req, res, next) {
        var id = req.params.id;
        var service = services[id];
        if (service !== undefined) {
            res.send(service);
        } else {
            next(new Service.ResourceNotFoundError(
                "Service " + id + " is not registered"));
        }
    });

    registry.post("/service", function (req, res, next) {
        var id, body = req.body;
        try {
            id = registry.add(body);
        } catch (err) {
            return next(new Service.InvalidContentError(err.message));
        }
        res.send(200, {
            message: "Service was added successfully",
            id: id
        });
    });

    registry.add = function (service) {
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

    registry.find = function (key, value) {
        for (var id in services) {
            var service = services[id];
            if (service[key] == value) {
                return service;
            }
        }
        return null;
    };

    registry.reset = function () {
        services = {};
        identifier = 1;
    };
    return registry;
}

var Registry = createRegistry();

Registry.proxy = function (url) {
    var client = Restify.createJsonClient({ url: url });
    var promise = new Promise();
    client.get("/", function (err, req, res, obj) {
        var proxy = createRegistry(obj);
        promise.resolve(proxy);
    });
    return promise;
}        

module.exports = Registry;