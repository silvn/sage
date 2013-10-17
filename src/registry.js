var Service = require(__dirname + "/service.js");

var Registry = new Service();

Registry.get("/", function (req, res, next) {
    res.send({
        services: []
    });
});

module.exports = Registry;