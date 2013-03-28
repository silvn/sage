/**
 * sage.js
 *
 * The main app
 */

// Process command-line arguments
(function () {
    confFile = absolutePath(process.argv[2]);
    var serviceName = process.argv[3];
    if (process.argv[4]) {
        logFile = fs.createWriteStream(process.argv[4]);
    } else {
        logFile = process.stdout;
    }
    if (confFile == null) {
        usage("Configuration file required!");
    }
    if (serviceName == null) {
        usage("Service name is required!");
    }

    configuration = require(confFile).Config;

    serviceConfig =
        envRequire(process.env.IRIS_SERVICE_CONF, DEFAULT_SERVICE_CONF);

    if (global.process.env.NODE_PORT != null) {
        configuration.appPort = global.process.env.NODE_PORT;
    }
    configuration.settings = serviceConfig.settings;
    if (!configuration.settings) {
        configuration.settings = {};
    }
    if (!configuration.settings.hostname) {
        configuration.settings.hostname = '0.0.0.0';
    }
    var i = 0;
    var services = serviceConfig.services;
    while (i < services.length && service == null) {
        if (services[i].name == serviceName) {
            service = services[i];
        }
        i++;
    }
    if (service == null) {
        usage("Service name " + serviceName + " is not configured.");
    }
    if (service.hostname == null) {
        service.hostname = configuration.settings.hostname;
    }

    setEndpoints();
})();

// Finds a configured service endpoint based on a set of criteria
exports.findService = function (args) {
    var comparators = [];
    if (args["type"]) {
        comparators.push(["type", function (type) {
            return args["type"] === type
        }]);
    }
    if (args["path"]) {
        comparators.push(["paths", function (paths) {
            for (path in paths) {
                if (paths[path] === args["path"]) return true;
            }
            return false;
        }]);
    }
    for (var serviceName in endpoints) {
        endpoint = endpoints[serviceName];
        var found = true;
        for (var i in comparators) {
            var comparator = comparators[i];
            var key = comparator[0];
            var func = comparator[1];
            found = func(endpoint[key]) && found;
        }
        if (found) {
            return serviceName;
        }
    }
    return null;
};

