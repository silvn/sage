var target  = __dirname + '/../../root/js/widgets/widget.js';
var documentStub = require(__dirname + '/stubs.js').documentStub;
var jQueryStub = require(__dirname + '/stubs.js').jQueryStub;
var Iris;

module.exports = {
    setUp: function (callback) {
        var sandbox = require('nodeunit').utils.sandbox;
        var context = sandbox(target, {
            console: console,
            document: documentStub,
            jQuery: jQueryStub
        });
        Iris = context.Iris;
        Iris.Renderer = {
            create: function (args) {
                var that = args;
                that.div = function () {};
                return that;
            }
        };
        Iris.getJSON = function (path, func) { func(); };
        documentStub.Stub.clearDocument();
        callback();
    },

    tearDown: function (callback) {
        delete Iris.Widget;
        delete Iris;
        callback();
    },

    createWithNoParamsThrowsOnDisplay: function (test) {
        var widget = Iris.Widget.create({
            about: { name: "SomeWidget" }
        });
        test.throws(function () {
            widget.display();
        }, null, "Without renderer defined, should throw an exception");
        test.done();
    },

    createWithRenderFunction: function (test) {
        var widget = Iris.Widget.create({
            about: {
                name: "SomeWidget"
            },
            display: function () {}
        });
        test.doesNotThrow(function () {
            widget.display();
        }, null, "display() is defined. Should not complain.");
        test.done();
    },

    createWithNonFunctionRender: function (test) {
        test.throws(function () {
            Iris.Widget.create({
                about: { name: "HelloWidget" },
                display: "A String"
            });
        }, null, "'display:' param to create() should not be a String");
        test.done();
    },

    aboutAsFunction: function (test) {
        var widget = Iris.Widget.create({
            about: function () {
                return { name: "FunctionAboutWidget" };
            }
        });
        test.equals(widget, Iris.Widget.FunctionAboutWidget);
        test.done();
    },

    aboutAsAssociativeArray: function (test) {
        var widget = Iris.Widget.create({
            about: { name: "ArrayAboutWidget" }
        });
        test.equals(widget, Iris.Widget.ArrayAboutWidget);
        test.done();
    },

    aboutAsOtherObjectThrowsError: function (test) {
        test.throws(function () {
            Iris.Widget.create({
                about: "AboutString"
            })
        }, null, "about: as a String should throw error");
        test.done();
    },

    cascadingMethods: function (test) {
        var widget = Iris.Widget.create({
            about: { name: "SomeWidget" }
        });
        test.equals(widget, widget.div("someDiv"));
        test.equals(widget, widget.div("div1").div("div2"));
        test.equals("div2", widget.divId);
        test.done();
    },

    divElement: function (test) {
        var widget = Iris.Widget.create({
            about: { name: "W" }
        });
        test.throws(function () {
            widget.divElement();
        }, null, "Should throw an error when no divId defined.");
        test.done();
    },

    renderLayout: function (test) {
        var calledRender = 0;
        var times = 5;
        var widget = Iris.Widget.create({ about: { name: "SomeWidget" } });
        widget.div('someDiv');
        for (var i = 0; i < times; i++) {
            widget.view({
                render: function (data) {
                    calledRender++;
                },
                dataPath: ""
            });
        }
        
        test.equals(0, calledRender,
            "render() should be called 0 times before display() " +
            "(called " + calledRender + " times)");
        widget.display();
        test.equals(times, calledRender,
            "render() should be called " + times + " times after display() " +
            "(called " + calledRender + " times)");
        test.done();
    },

    malformedLayoutThrowsError: function (test) {
        var layoutWidget = function (renderItem) {
            var widget = Iris.Widget.create({ about: { name: "SomeWidget" } });
            widget.view(renderItem);
        };
        // No render function
        test.throws(function () {
            layoutWidget({ dataPath: "" });
        }, null, "widget.view with empty object should throw error");

        // 'render:' is not a function
        test.throws(function () {
            layoutWidget({ dataPath: "", render: {} });
        }, null, "widget.view should throw error on non-function render:");

        // No error
        test.doesNotThrow(function () {
            layoutWidget({ render: function () {}, dataPath: "/" });
        }, null, "Should be valid layout.view() usage");
        test.done();
    },

    layoutRenderer: function (test) {
        var calledRender = false;
        Iris.Renderer = {
            MyRenderer: {
                render: function () {
                    calledRender = true;
                },
                div: function () {}
            }
        };
        var widget = Iris.Widget.create({ about: { name: "MyWidget" } });
        widget.div("div90210");
        widget.view({
            renderer: "MyRenderer",
            dataPath: "/"
        });
        
        test.ok(!calledRender,
            "Should not have called render() before widget.display()");
        widget.display();
        test.ok(calledRender,
            "Should have called render() after widget.display()");
        test.done();
    },
    
    transformDataForRenderer: function (test) {
        var calls = [];
        Iris.Renderer = {
            MyRenderer: {
                render: function (data) { calls.push("render"); },
                div: function () {}
            }
        };
        var widget = Iris.Widget.create({ about: { name: "MyWidget" } })
            .div("someDivId")
            .view({
                renderer: "MyRenderer",
                dataPath: "",
                transform: function (data) {
                    calls.push("transform");
                },
            });
        widget.getJSON = function (path, fn) {
            fn();
        };
        test.deepEqual([], calls,
            "transform: should not be called before widget.display()");
        widget.display();
        test.deepEqual(["transform", "render"], calls,
            "widget.display() should trigger render(), then transform()");
        test.done();
    },
    
    multipleRenderers: function (test) {
        var calls = [];
        var widget = Iris.Widget.create({ about: { name: "LayoutWidget" } })
        .div("someOtherDiv")
        .view({
            dataPath: "/dataPath1",
            render: function () {
                calls.push("Renderer1");
            }
        })
        .view({
            dataPath: "/dataPath2",
            render: function () {
                calls.push("Renderer2");
            }
        });
        widget.getJSON = function (path, fn) {
            fn();
        };
        test.deepEqual([], calls);
        widget.display();
        test.deepEqual(["Renderer1", "Renderer2"], calls);
        test.done();
    },
    
    widgetRenderReturnValueAsString: function (test) {
        var widget = Iris.Widget.create({ about: { name: "SomeWidget" } });
        widget.view({ render: function () { return "Foobar"; } });
        widget.div('testdiv');
        widget.display();
        var node = documentStub.Stub.lastCreatedElement();
        test.equals("Foobar", node.innerHTML,
            "Expected innerHTML to be set to 'Foobar', instead got " +
            node.innerHTML);
        test.done();
    },
    
    widgetRenderReturnValueAsNode: function (test) {
        var widget = Iris.Widget.create({ about: { name: "SomeWidget" } });
        widget.view({
            render: function () {
                return new String("Yomama");
            }
        });
        widget.div('testdiv');
        test.equals(null, documentStub.Stub.lastCreatedElement(),
            "Expected contents to be null before display()");
        widget.display();
        var node = documentStub.Stub.lastCreatedElement();
        test.equals(1, node.children.length,
            "Expected 1 child node, instead got " +
            node.children.length);
        test.done();
    }
};