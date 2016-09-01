SRC_JS = $(shell git ls-files \*.js)
SRC_HTML = $(shell git ls-files \*.html)
SRC_CSS = $(shell git ls-files \*.css)
DEFAULT_FLAGS := --reporter spec --ui tdd --recursive test
DEPS := deps

all: test lint coverage

deps:
	npm set progress=false
	npm install

test: $(DEPS)
	./node_modules/.bin/mocha $(DEFAULT_FLAGS)

lint: $(DEPS)
	./node_modules/.bin/jshint --verbose $(SRC_JS)
	./node_modules/.bin/htmlhint --config .htmlhintrc $(SRC_HTML)
	./node_modules/.bin/csslint --config .csslintrc $(SRC_CSS)

style: $(DEPS)
	./node_modules/.bin/jscs -e --verbose $(SRC_JS)

reg: test lint style

configure: $(DEPS)


.PHONY: all deps test lint style reg
