var restify = require("restify");
var Q       = require("q");
var _       = require("underscore");
var bunyan  = require("bunyan");

var Collection = require("./collection");

/**
 * @class Service
 *
 * The base service, providing all service functionality
 * Includes the Service API
 * 
 * @constructor
 * @param {Object} properties A set of properties. These properties will be
 *                 used to describe the service within the {@link Registry}.
 */
function Service(properties) {
    var self = this;
    self.props = (properties || {});
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
    self.restify = restify.createServer({ log: self.logger });
    self.restify.use(restify.bodyParser());
    self.restify.pre(function (req, res, next) {
        req.log.info({req: req}, "start");
        return next();
    });
    self.restify.on('after', function (req, res, route, e) {
        req.log.info({res: res}, "finish");
    });
    self.restify.on("uncaughtException", function (req, res, route, e) {
        res.send(new restify.InternalError(e, e.message || 'unexpected error'));
        req.log.error(e.stack, "finish");
        return (true);
    });
    self.resMap = {};
    self.entities = {};
    self.isListening = false;
}

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
}

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
        var collection = service.entities[key];
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
        var url = service.url();
        var key = req.params.resource;
        var collection = service.entities[key];
        collection.fetch().done(function () {
            res.send(this.map(function (resource) {
                return [url, key, resource.property("id")].join("/");
            }));
        });
    });
}

function setResourceRoutes(service, key) {
    var base = service.url() + "/" + key;
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
    params = params || {};
    if (params.port === undefined) {
        throw new Error("port is a required parameter");
    }
    if (this.restify.address() !== null) {
        throw new Error("service already running at " + this.restify.address());
    }
    var deferred = Q.defer();
    this.listen(params.port, function () {
        deferred.resolve(true);
    });
    this.startedPromise = deferred.promise;
    return this;
};

/**
 * @method
 * Stops the service.
 * 
 * @chainable
 */
Service.prototype.stop = function () {
    var self = this;
    if (this.startedPromise === null) {
        throw new Error("service has not started");
    }
    this.startedPromise.done(function () {
        self.restify.close();
    });
    self.isListening = false;
    return this;
};

/**
 * @method
 * Listens to a given port. Same effect as {@link #start}, used for
 * compatibility with Connect.
 * 
 * @chainable
 */
Service.prototype.listen = function () {
    ensureDefaultRoutes(this);
    this.isListening = true;
    return this.restify.listen.apply(this.restify, arguments);
}

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
            (new resource) instanceof Collection;
        var ProtoCollection = isCollection ?
            resource : Collection.extend({ resource: resource });
        this.entities[key] = new ProtoCollection();
        this.entities[key].identifier = 1;
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
