var iris   = require('./iris-base.js');
var config = iris.loadConfiguration();
var app    = iris.app;
var routes = iris.routes;
var exec   = require('child_process').exec;
var http   = require('http');

console.log(iris.services);

var servicePorts = null;
function servicePortFor(serviceName) {
    if (servicePorts == null) {
        servicePorts = [];
        for (var key in iris.services) {
            var service = iris.services[key];
            servicePorts[service['name']] = service['port'];
        }
    }
    return servicePorts[serviceName];
}

// Routes
app.get('/', function(req, res) {
    // TODO: Provide routes? Description?
    res.end();
});

app.get('/:species/chromosomes', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    res.end(iris.chromosomes[req.query["species"]]);
});

function httpGET(response, service, path) {
    http.get({
        port: servicePortFor(service),
        path: path
    }, function(proxyResponse) {
        proxyResponse.on('data', function(chunk) {
            response.end(chunk);
        })
    });    
}

app.get('/gwas/:study/maxscore', function(req, res) {
    httpGET(res, 'examples-fastbit', '/fbsql?d=GWAS/' + req.params.study + '&s=max(score)')
});

app.get('/gwas/:study/scatter', function(req, res) {
    httpGET(res, 'examples-fastbit', '/scatter?' + [ 
            'd=GWAS/' + req.params.study + '/' + req.query["chr"],
            'c1=pos',
            'c2=score',
            'n1=0',
            'n2=0',
            'b1='+req.query["b1"],
            'b2='+req.query["b2"],
            'x1='+req.query["x1"],
            'x2='+req.query["x2"]
        ].join('&'));
});

// Mongo fetches
app.get('/data/phenotypes/:phenotype', function(req, res) {
    db.open(function(err, db) {
        db.collection('arabidopsis2010_sample_phenotype', function(err, collection) {
            collection.find({
                'phenotype_name': req.params.phenotype
            }, {
                'phenotype_values': 1
            }, function(err, cursor) {

                cursor.each(function(err, doc) {
                    if (doc === null) {
                        db.close();
                        res.end();
                    }
                    if (doc != null) {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        res.end(JSON.stringify(doc["phenotype_values"]));
                    }
                });
            });
        });
    });
});

app.get('/data/phenotypes', function(req, res) {
    var items = [];
    db.open(function(err, db) {
        db.collection('arabidopsis2010_sample_phenotype', function(err, collection) {
            collection.find({}, {
                'phenotype_name': 1
            }, function(err, cursor) {
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                cursor.each(function(err, doc) {
                    if (doc === null) {
                        res.end(JSON.stringify(items));
                        db.close();
                    }
                    if (doc != null) {
                        items.push(doc["phenotype_name"]);
                    }
                });
            });
        });
    });
});

// GO term histogram (all genes)
app.get('/histogram/GO', function(req, res) {
    var cmd = config.binDir + '/fbsql -s "GO_term,count(*)" -d ' + config.dataDir + '/gene2GO';
    console.log(cmd);
    var fbsql = exec(cmd, function(error, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

// GO term histogram for a GWAS study (all snps)
app.get('/histogram/GO/GWAS/:study', function(req, res) {
    var cmd = config.binDir + '/gwas2go -d ' + config.dataDir + ' -s ' + req.params.study;
    console.log(cmd);
    var join = exec(cmd, function(err, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

// GO term histogram for a GWAS study where snps are filtered by pos or score
app.get('/histogram/GO/GWAS/:study/:where', function(req, res) {
    var cmd = config.binDir + '/gwas2go -d ' + config.dataDir + ' -s ' + req.params.study + ' -w "' + req.params.where + '"';
    console.log(cmd);
    var join = exec(cmd, function(err, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

app.get('/gene2GWAS', function(req, res) {
    var cmd = config.binDir + '/fbsql -d ' + config.dataDir + '/GWAS_snp_consequences -s "study_id,gene_stable_id,max(score)"';
    var fbsql = exec(cmd, {
        maxBuffer: 10000 * 1024
    }, function(error, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

app.get('/gene2GWAS/:gene_id', function(req, res) {
    var cmd = config.binDir + '/fbsql -d ' + config.dataDir + '/GWAS_snp_consequences -s "study_id,max(score)" -w "gene_id=' + req.params.gene_id + '"';
    var fbsql = exec(cmd, {
        maxBuffer: 10000 * 1024
    }, function(error, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

app.get('/data/:d/pcoords', function(req, res) {
    var cmd = config.binDir + '/scatter -a 1 -d ' + config.dataDir + '/' + req.params.d + ' -b1 ' + req.query["b1"] + ' -b2 ' + req.query["b2"] + ' -c1 ' + req.query["c1"] + ' -c2 ' + req.query["c2"] + ' -n1 ' + req.query["n1"] + ' -n2 ' + req.query["n2"] + ' -x1 ' + req.query["x1"] + ' -x2 ' + req.query["x2"];
    if (req.query["w"]) {
        cmd = cmd + ' -w "' + req.query["w"] + '"';
    }

    console.log(cmd);
    var scatter = exec(cmd, {
        maxBuffer: 10000 * 1024
    }, function(error, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

app.get('/data/:d/ranges', function(req, res) {
    var cmd = config.binDir + "/ranges -d " + config.dataDir + "/" + req.params.d;
    console.log(cmd);
    var ranges = exec(cmd, function(error, stdout, stderr) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(stdout);
    });
});

iris.startService();