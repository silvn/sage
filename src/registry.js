var Service = require("./service");
var Promise = require("./promise");
var Restify = require("restify");

/**
 * @class Registry
 * Describes a set of registered services.
 * 
 * @extends Service
 */
(function (module) {
    "use strict";
    function createRegistry(params) {
        var registry = new Service();
        var services = {};
        if (params !== undefined) {
            services = params.services;
        }
        var identifier = 1;

        /**
         * @method services
         * Shows the currently-registered services.
         * 
         * @return {Object}
         * @return {String} return.id
         * @return {Object} return.metadata
         */
        registry.services = function () {
            return services;
        };

        registry.get("/", function (req, res, next) {
            var json = {};
            for (var id in services) {
                if (services.hasOwnProperty(id)) {
                    var service = services[id];
                    json[registry.url() + "/service/" + id] = service;
                }
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
            var body = req.body;
            try {
                registry.add(body).done(function (id) {
                    res.send(200, {
                        message: "Service was added successfully",
                        id: id
                    });
                    next();
                }).fail(function (err) {
                    return next(new Service.InvalidContentError(err.message));
                });
                return next();
            } catch (err) {
                return next(new Service.InvalidContentError(err.message));
            }
        });

        /**
         * @method add
         * Adds a service to the registry.
         * 
         * @param {Service|Object} service A service object or plain object
         * @return {Number} The assigned ID
         */
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
            var promise = new Promise();
            
            /* FIXME: Slight delay to allow all services to register before
             * the ping, so that the services are notified with the all the info
             */
            setTimeout(function () {
                registry.client(props.url).put("/settings",
                    { registry: registry.url() },
                    function (err, req, res) {}
                );
            }, 100);
            services[id] = props;
            promise.resolve(id);
            return promise;
        };

        /**
         * @method find
         * Finds a registered service based on parameters. Returns a found
         * service's metadata or null if a service is not found.
         * 
         * @param {Mixed} key The name of the parameter
         * @param {Mixed} value The value of the parameter
         * @return {Object} Service metadata  
         */
        registry.find = function (key, value) {
            for (var id in services) {
                if (services.hasOwnProperty(id)) {
                    var service = services[id];
                    if (service[key] == value) {
                        return service;
                    }
                }
            }
            return null;
        };

        /**
         * @method reset
         * Remove any registered services from the registry
         */
        registry.reset = function () {
            services = {};
            identifier = 1;
        };
        return registry;
    }

    var Registry = undefined;
    module.exports = function () {
        if (Registry === undefined) {
            Registry = createRegistry();
            /**
             * @method proxy
             * Create a proxy object for a remote registry. The proxy object
             * supports similar operations as a local registry.
             * 
             * @param {String} url The address of the remote registry
             * @return {Registry} A proxy object representing the registry
             */
            Registry.proxy = function (url) {
                var client = Restify.createJsonClient({ url: url });
                var promise = new Promise();
                client.get("/", function (err, req, res, obj) {
                    var proxy = createRegistry(obj);
                    promise.resolve(proxy);
                });
                return promise;
            };
        }
        return Registry;
    }
})(module);