var path     = require('path');
var optimist = require('optimist');
var fs       = require('fs');
var http     = require('http');
var util     = require('util');

var optimist = require('optimist')
    .usage("Start a Sage service\nUsage: $0 [options]")
    .describe("name",     "The service name")
    .describe("service",  "The service file")
    .describe("port",     "The network port")
    .describe("log",      "File to log output")
    .describe("registry", "A registry with which to register the service");
var argv = optimist.argv;

// Private utility functions
function absolutePath(filename) {
    if (filename == null) {
        return null;
    }
    var normalized = path.normalize(filename);
    if (!normalized.match(/^\//)) {
        normalized = path.join(global.process.env.PWD, normalized);
    }
    return normalized;
}

var serviceName = argv.name;
if (argv.log) {
    var log = fs.createWriteStream(argv.log);
    console.log = console.err = function () {
        log.write(util.format.apply(null, arguments) + "\n");
    };
}

var service = require(argv.service);
service.start({ port: argv.port });
console.log("[service %s %s]", argv.name, service.url());