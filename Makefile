PACKAGE  = sage
NODEBIN  = ./node_modules/.bin
MOCHA    = $(NODEBIN)/mocha
JSDOC    = ./external/jsdoc/jsdoc
NPM      = npm
GIT      = git

MOCHAOPTS =
JSDOCCONF = ./conf/jsdoc.json
JSDOCDEST = ./dist/doc/api
TESTDIR ?= test

all: test

init-npm:
	@ $(NPM) install

init-submodules:
	@ $(GIT) submodule update --init

init: init-npm init-submodule

docs:
	@ $(JSDOC) --configure $(JSDOCCONF) --destination $(JSDOCDEST)

dist: init docs
	
test: init-npm
	@ $(MOCHA) $(MOCHAOPTS) test/*.js

clean:
	rm -rf $(DISTLIB) $(BUILDDIR) $(JSDOCDEST)
	
dist-clean: clean
	rm -rf node_modules/
	
.PHONY: test all dist