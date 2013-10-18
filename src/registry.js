var Service = require(__dirname + "/service.js");

var Registry = new Service();

Registry.get("/", function (req, res) {
    res.send({
        services: []
    });
    return false;
});

module.exports = Registry;