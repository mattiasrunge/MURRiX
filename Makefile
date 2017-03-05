SRC_JS = $(shell git ls-files \*.js)
SRC_HTML = $(shell git ls-files \*.html)
SRC_CSS = $(shell git ls-files \*.css)
DEFAULT_FLAGS := --reporter spec --ui tdd --recursive test
DEPS := deps

all: test lint coverage

deps:
	yarn

test: $(DEPS)
	./node_modules/.bin/mocha $(DEFAULT_FLAGS)

lint: $(DEPS)
	./node_modules/.bin/eslint $(SRC_JS)
	./node_modules/.bin/htmlhint --config .htmlhintrc $(SRC_HTML)
	./node_modules/.bin/csslint --config .csslintrc $(SRC_CSS)

reg: test lint

configure: $(DEPS)


.PHONY: all deps test lint reg
