# Sage
**Version 0.1.2**

A REST service architecture for scientific data.

[![Build Status](https://travis-ci.org/silvn/sage.png)](https://travis-ci.org/silvn/sage)

##External Dependencies
The following tools need to be installed separately (e.g., with [Homebrew](http://mxcl.github.com/homebrew/)) before Sage and its dependencies can be installed:

* [Node.js](nodejs.org)
* [Git](git-scm.com)

##Overview
Sage is equipped with a command-line tool, quaintly named `sage`, to manage the project. It can be used to install dependencies, start Sage and it services, monitor Sage, and shut it down.

To use the tool, run:

    source sage.env

##Installation
To install Sage, along with its dependencies, run:

    sage install

To check the installation, and execute project tests, run:

    sage check

To install example data used by the demo, run:

    sage examples

##Configuration
Sage services are configured in a simple configuration file in `conf/services.json` listing an HTTP port, the name of the service, the Node.js control file, and a configuration file. A sample services configuration is available at `conf/services-sample.json`. To get started:

    cp conf/services-sample.json conf/services.json

##Running Sage
To start Sage, run:

    sage start

All the services configured in `conf/services.json` are started. Their process IDs and network ports are listed.

To stop Sage, run:

    sage stop

To restart Sage, run:

    sage restart

To determine whether Sage and its services are running, run:

    sage status

Each of the above management commands can be run on individual services by supplying the service name as an argument:

    sage {start,stop,restart,status} <service-name>

##More Help

[API documentation for the library](http://silvn.github.io/sage/api)

The `sage` startup script has a general and command-specific help facility. To find out more about it, run:

    sage help [<command>]

##Coding Style and Conventions
TODO

##Changelog

####v0.1.2

* Handling URL templates for resource fetching.
* Bugs zapped.

####v0.1.1

* XML responses
* Collection schema use associated resource schema

####v0.1.0

* Services
    * Logging with Bunyan
* Service Registry
    * Registry proxies for remote services.
    * `Service#registry` promises to be resolved when registry pings.
* Resources and Collections
    * Resources and collections can be associated with services.
    * Services provide default routes and responses.
    * Services can fetch collections and resources from remote endpoints.
    * Resources can override parsing data from remote endpoints.
    * Collections act as native Arrays.
* Sage class exposes Service, Resource, and Registry.

## License

    Copyright (c) 2012-2013 Jer-Ming Chia <jermth at gmail.com>
    Copyright (c) 2012-2013 Andrew Olson <aolson at me.com>
    Copyright (c) 2012-2013 Shiran Pasternak <shiranpasternak at gmail.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions: The above
    copyright notice and this permission notice shall be included in all copies
    or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    DEALINGS IN THE SOFTWARE.
