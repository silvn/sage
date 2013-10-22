PACKAGE  = sage
NODEBIN  = ./node_modules/.bin
MOCHA    = $(NODEBIN)/mocha
NPM      = npm
GIT      = git
JSDUCK  := $(shell which jsduck)

MOCHAOPTS ?=
APIDOC     = ./docs/api
TESTDIR    = test

SOURCES  = $(shell find src -name "*.js")

all: test

node_modules:
	@ $(NPM) install

init-npm: node_modules

init-submodules:
	@ $(GIT) submodule update --init

init: init-npm init-submodule
	
$(APIDOC):
	@ mkdir -p $(APIDOC)

$(APIDOC)/index.html: $(SOURCES) $(APIDOC)
ifndef JSDUCK
	$(error JSDuck not found (install with `gem install jsduck`).)
endif
	@ $(JSDUCK) --builtin-classes --output $(APIDOC) -- $(SOURCES)

docs: $(APIDOC)/index.html

dist: init docs
	
test: init-npm
	@ $(MOCHA) $(MOCHAOPTS) test/*.js

clean:
	rm -rf $(DISTLIB) $(BUILDDIR) $(APIDOC)
	
dist-clean: clean
	rm -rf node_modules/
	
.PHONY: test all dist