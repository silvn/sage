var restify = require("restify");
var _       = require("underscore");
var bunyan  = require("bunyan");
var XML     = require("js2xmlparser");

var Collection = require("./collection");
var Promise    = require("./promise");

/* jshint loopfunc: true, newcap: false */

(function (module) {
    "use strict";
    /**
     * @class Service
     *
     * The base service, providing all service functionality
     * Includes the Service API.
     * 
     * @constructor
     * @param {Object} properties A set of properties. These properties will be
     *                 used to describe the service within the {@link Registry}.
     *                 The constructor has some specially-handled properties:
     * @param {Function} properties.initialize (optional)
     *        A function called when a service is started
     * @param {String} properties.registry (optional)
     *        The address of a remote registry
     */

    function Service(properties) {
        var self = this;
        self.props = (properties || {});
        self.settings = {};
        self.logger = bunyan.createLogger({
            name: "service",
            streams: [
                { level: "info",  stream: process.stdout },
                { level: "error", stream: process.stderr }
            ],
            serializers: {
                req: bunyan.stdSerializers.req,
                res: bunyan.stdSerializers.res
            }
        });
        if (Service._logLevel !== undefined)
            self.logger.level(Service._logLevel);
        self.restify = restify.createServer({
            log: self.logger,
            formatters: {
                "text/xml": function formatXML(req, res, body, cb) {
                    if (body instanceof Error) {
                        res.statusCode = body.statusCode || 500;
                        if (body.body) {
                            body = body.body;
                        } else {
                            body = { message: body.message };
                        }
                    }
                    var xml = XML("sage", body, {
                        prettyPrinting: { enabled: false },
                        wrapArray: { enabled: true }
                    });
                    res.setHeader('Content-Length', Buffer.byteLength(xml));
                    return (xml);
                },
                "application/json": function formatJSON(req, res, body) {
                    if (body instanceof Error) {
                        res.statusCode = body.statusCode || 500;
                        if (body.body) {
                            body = body.body;
                        } else {
                            body = { message: body.message };
                        }
                    } else if (Buffer.isBuffer(body)) {
                        body = body.toString('base64');
                    }
                    var data = JSON.stringify(body);
                    res.setHeader('Content-Length', Buffer.byteLength(data));
                    return (data);
                }
                
            }
        });
        self.restify.use(restify.bodyParser());
        self.restify.pre(function (req, res, next) {
            req.log.info({req: req}, "start");
            return next();
        });
        self.restify.on("after", function (req, res, route, e) {
            req.log.info({res: res}, "finish");
        });
        self.restify.on("uncaughtException", function (req, res, route, e) {
            res.send(new restify.InternalError(e, e.message ||
                'unexpected error'));
            req.log.error(e.stack, "finish");
            return (true);
        });
        self.resMap = {};
        self.collections = {};
        self.isListening = false;
        self.registryPromise = new Promise(self);
        if (self.props.hasOwnProperty("initialize")) {
            self.initialize = self.props.initialize;
            delete self.props.initialize;
        }
        if (self.props.hasOwnProperty("registry")) {
            self.registryURL(self.props.registry);
            delete self.props.registry;
        }
    }

    /**
     * @method initialize
     * A virtual method called when the service is started.
     */
    Service.prototype.initialize = function () {};

    /**
     * @method registryURL
     * Sets the address of a remote registry.
     * 
     * @param {String} address The remote URL
     */
    Service.prototype.registryURL = function (value) {
        if (value !== undefined) {
            this.settings.registry = value;
            this.registryPromise.resolve(value);
        }
        return this.settings.registry;
    };

    /**
     * @method logLevel
     * Sets the service log-level. Used for logging.
     * 
     * @static
     * @private
     */
    Service.logLevel = function (level) {
        this._logLevel = level;
        return this;
    };

    /**
     * @method extend
     * Extends the service.
     * 
     * @param {Object} args Arguments with which to extend
     * @return {Service} An extended service
     * 
     * @static
     */
    Service.extend = require("./extend");

    var DELEGATE_METHODS = [
        /**
         * @method address
         * Gets URL address info about the service
         */
        "address",

        /**
         * @method get
         * Defines HTTP GET
         * @param {String} path
         * @param {Function} callback
         * @param {ClientRequest} callback.request The server request
         * @param {ServerResponse} callback.response The server response
         * @param {Function} callback.next The next callback
         */
        "get",

        /**
         * @method post
         * Defines HTTP POST
         * @param {String} path
         * @param {Function} callback
         * @param {ClientRequest} callback.request The server request
         * @param {ServerResponse} callback.response The server response
         * @param {Function} callback.next The next callback
         */
        "post",

        /**
         * @method put
         * Defines HTTP PUT
         * @param {String} path
         * @param {Function} callback
         * @param {ClientRequest} callback.request The server request
         * @param {ServerResponse} callback.response The server response
         * @param {Function} callback.next The next callback
         */
        "put",

        /**
         * @method head
         * Defines HTTP HEAD
         * @param {String} path
         * @param {Function} callback
         * @param {ClientRequest} callback.request The server request
         * @param {ServerResponse} callback.response The server response
         * @param {Function} callback.next The next callback
         */
        "head"
    ];

    /**
     * @method
     * Implements HTTP routes if they aren't already defined.
     * 
     * @private
     * @static
     */
    function ensureDefaultRoutes(service) {
        service.get('/',  function (req, res, next) {
            var resources = {};
            for (var key in service.resMap) {
                if (service.resMap.hasOwnProperty(key))
                    resources[service.url() + "/" + key] =
                        service.resMap[key].schema();
            }
            res.send({ resources: resources });
            return next();
        });
        service.head('/', function (req, res, next) {
            res.send();
            return next();
        });
        service.get("/settings", function (req, res, next) {
            res.send(service.settings);
        });
        service.put("/settings", function (req, res, next) {
            var data = req.body;
            for (var key in data) {
                if (data.hasOwnProperty(key))
                    service.settings[key] = data[key];
            }
            if (data.registry !== undefined) {
                service.registryPromise.resolve(data.registry);
            }
            res.send({ message: "Settings successfully set" });
        });
        service.get("/:resource", function (req, res, next) {
            var key = req.params.resource;
            var content = { routes: {} };
            var resource = service.resMap[key];
            if (resource === undefined) {
                return next(new Service.ResourceNotFoundError(
                    "Resource " + key + " not found"));
            }
            content.schema = _.clone(resource.schema());
            content.routes[[service.url(), key, "list"].join("/")] =
                "List all " + key + " resources";
            res.send(content);
            next();
        });
        service.post("/:resource", function (req, res, next) {
            var key = req.params.resource;
            var collection = service.collections[key];
            if (collection === undefined) {
                return next(new Service.ResourceNotFoundError(
                    "Cannot create an undefined resource"
                ));
            }
            var id = collection.identifier++;
            req.body.id = id;
            var resource = collection.add(req.body);
            res.send({ id: id });
        });
        service.get("/:resource/list", function (req, res, next) {
            var key = req.params.resource;
            var list = fetchCollection(service, key, function (collection) {
                res.send(collection.map(function (resource) {
                    var id = resource.property("id");
                    return {
                        id:  id,
                        url: [service.url(), key, id].join("/")
                    };
                }));
            });
        });
        service.get("/:resource/:id", function (req, res, next) {
            var key = req.params.resource;
            var id  = req.params.id;
            fetchCollection(service, key, function (collection) {
                var found = false;
                var i = 0;
                while (i < collection.length && !found) {
                    var resource = collection[i];
                    if (resource.property("id") == id) {
                        found = true;
                        resource.fetch().done(function () {
                            return res.send(resource.properties());
                        }).fail(function (err) {
                            return res.send(new Service.InvalidError(
                                "Couldn't fetch resource: " + err.message
                            ));
                        });
                    }
                }
                if (!found) {
                    res.send(new Service.ResourceNotFoundError(
                        "Can't find " + key + " resource " + id)
                    );
                }
            });
        });
    }

    function setResourceRoutes(service, key) {
        var base = service.url() + "/" + key;
    }

    /**
     * @method fetchCollection
     * Fetch a collection from a remote endpoint.
     * 
     * @param {Service} service The service
     * @param {String} key The resource key
     * @param {Function} callback The function called when the collection is fetched
     * 
     * @static
     * @private
     */
    function fetchCollection(service, key, callback) {
        var collection = service.collections[key];
        function postprocessCollection(collection) {
            collection.fetched = true;
            collection.forEach(function (resource) {
                var id = resource.property("id");
                if (id === undefined) {
                    id = collection.identifier++;
                    resource.property("id", id);
                }
                if (resource.url() === null) {
                    resource.url = function () {
                        return [collection.url(), id].join("/");
                    };
                }
            });
            callback(collection);
        }
        if (collection.fetched) {
            callback(collection);
        } else if (collection.url() === null) {
            postprocessCollection(collection);
        } else {
            collection.fetch().done(function () {
                postprocessCollection(collection);
            }).fail(function (err) {
                if (err !== undefined) {
                    throw new Service.InternalError(
                        "Could not fetch collection: " + err.message
                    );
                }
            });
        }
    }

    /**
     * @method
     * Starts the service.
     * 
     * @param {Object} params Start parameters
     * @param {Number} params.port The port on which to start the service
     * @chainable
     */
    Service.prototype.start = function (params) {
        var self = this;
        params = params || {};
        if (params.port === undefined) {
            throw new Error("port is a required parameter");
        }
        if (self.restify.address() !== null) {
            throw new Error(
                "service already running at " + self.restify.address()
            );
        }
        self.startedPromise = new Promise(self);
        self.listen(params.port, function () {
            self.startedPromise.resolve(true);
        });
        return self.startedPromise;
    };

    /**
     * @method
     * Stops the service.
     * 
     * @return {Promise}
     */
    Service.prototype.stop = function () {
        var self = this;
        var stopPromise = new Promise(self);
        if (this.startedPromise === null) {
            throw new Error("service has not started");
        }
        this.startedPromise.done(function () {
            self.restify.close();
            stopPromise.resolve();
        });
        self.isListening = false;
        return stopPromise;
    };

    /**
     * @method
     * Listens to a given port. Same effect as {@link #start}, used for
     * compatibility with Connect.
     * 
     * @chainable
     */
    Service.prototype.listen = function (port, callback) {
        var self = this;
        ensureDefaultRoutes(self);
        self.isListening = true;
        var ret = self.restify.listen(port, callback);
        self.property("url", self.restify.url);
        if (typeof(callback) === "function") {
            callback();
        }
        self.initialize();
        return ret;
    };

    /**
     * @method property
     * Gets or sets a property
     * 
     * @param {String} name    The name of the property
     * @param value (optional) The value of the property
     * @return {Mixed} The value of the property
     */
    Service.prototype.property = function (prop, value) {
        if (value !== undefined) {
            this.props[prop] = value;
        }
        return this.props[prop];
    };

    /**
     * @method
     * Gets the set of service properties.
     * 
     * @return The set of properties
     */
    Service.prototype.properties = function () {
        return this.props;
    };

    /**
     * @method
     * Gets the URL for the running service.
     */
    Service.prototype.url = function () {
        return this.restify.url;
    };
    
    /**
     * @method client
     * Returns an HTTP client.
     * 
     * @param {String} url (optional) The address of the remote service
     *     (defaults to Service#url()).
     * @return {Client}
     */
    Service.prototype.client = function (url) {
        return restify.createJsonClient({
            url: (url || this.url())
        });
    };

    /**
     * @method
     * Gets or sets a resource for this service.
     * 
     * @param {String} name The name of the resource
     * @param {Resource} resource (optional) The resource to set
     */
    Service.prototype.resource = function (key, resource) {
        if (resource !== undefined) {
            this.resMap[key] = resource;
            var isCollection = typeof(resource) === "function" &&
                (new resource()) instanceof Collection;
            var ProtoCollection = isCollection ?
                resource : Collection.extend({ resource: resource });
            this.collections[key] = new ProtoCollection();
            this.collections[key].identifier = 1;
            setResourceRoutes(this, key);
        }
        return this.resMap[key];
    };

    /**
     * @method
     * Gets the set of resources for this service.
     * 
     * @return {Object} The set of resources
     * @return {String} return.key The key of the resource
     * @return {Resource} return.value The resource itself
     */
    Service.prototype.resources = function () {
        return this.resMap;
    };

    /**
     * @method listening
     * Whether the service is currently running.
     * 
     * @return {Boolean} Is the service running?
     */
    Service.prototype.listening = function () {
        return this.isListening;
    };

    Service.prototype.registry = function () {
        var registry = require("./registry")();
        var promise = new Promise(this);
        this.registryPromise.done(function (url) {
            registry.proxy(url).done(function (proxy) {
                promise.resolve(proxy);
            });
        });
        return promise;
    };

    DELEGATE_METHODS.forEach(function (method) {
        Service.prototype[method] = function () {
            return this.restify[method].apply(this.restify, arguments);
        };
    });

    // Grab Restify's error classes
    for (var fn in restify) {
        if (restify.hasOwnProperty(fn) &&
            typeof restify[fn] === "function" &&
            fn.match(/Error$/) !== null)
            Service[fn] = restify[fn];
    }

    module.exports = Service;
})(module);

/**
 * @class ClientRequest
 * External class, defined by the [Node.js HTTP module][1]
 * 
 * [1]: http://nodejs.org/api/http.html#http_class_http_clientrequest
 */
/**
 * @class ServerResponse
 * Defined by the [Node.js HTTP module][1]
 * 
 * [1]: http://nodejs.org/api/http.html#http_class_http_serverresponse
 */
/**
 * @class Client
 * Defined by [Restify][1]
 * 
 * [1]: http://mcavage.me/node-restify/#client-api
 */
