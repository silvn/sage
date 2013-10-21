/**
 * @ module service
 *
 * The base service, providing all service functionality
 * Includes the Service API
 */

var util    = require("util");
var restify = require("restify");
var Q       = require("q");
var _       = require("underscore");

function Service(properties) {
    this.props = (properties || {});
    this.restify = restify.createServer();
    this.restify.use(restify.bodyParser());
    this.resources = {};
}

Service.extend = function (args) {
    var Extended = function () {
        for (var prop in args) {
            this[prop] = args[prop];
        }
    };
    util.inherits(Extended, Service);
    return Extended;
};

var DELEGATE_METHODS = ["address", "get", "post", "put", "head"];

function ensureDefaultRoutes(service) {
    service.get('/',  function (req, res, next) {
        var resources = {};
        for (var key in service.resources) {
            resources[service.url() + "/" + key] =
                service.resources[key].schema();
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
        content.schema = _.clone(service.resources[key].schema());
        content.routes[[service.url(), key, "list"].join("/")] =
            "List all " + key + " resources";
        res.send(content);
        next();
    });
    service.get("/:resource/list", function (req, res, next) {
        next();
    });
}

function setResourceRoutes(service, key) {
    var base = service.url() + "/" + key;
}

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

Service.prototype.stop = function () {
    var self = this;
    if (this.startedPromise === null) {
        throw new Error("service has not started");
    }
    this.startedPromise.done(function () {
        self.restify.close();
        this.started = undefined;
    });
    return this;
};

Service.prototype.listen = function () {
    ensureDefaultRoutes(this);
    return this.restify.listen.apply(this.restify, arguments);
}

Service.prototype.property = function (prop, value) {
    if (value !== undefined) {
        this.props[prop] = value;
    }
    return this.props[prop];
};

Service.prototype.properties = function () {
    return this.props;
};

Service.prototype.url = function () {
    return this.restify.url;
};

Service.prototype.resource = function (key, value) {
    if (value !== undefined) {
        this.resources[key] = value;
        setResourceRoutes(this, key);
    }
    return this.resources[key];
}

DELEGATE_METHODS.forEach(function (method) {
    Service.prototype[method] = function () {
        return this.restify[method].apply(this.restify, arguments);
    };
});

module.exports = Service;