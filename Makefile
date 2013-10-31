SRC = $(shell find . \( -name "*.js" \) -o \( -name node_modules -prune \) -type f | sort)

lint:
	@jshint ${SRC}

test:
	@mocha --reporter spec --ui tdd --recursive lib

watchtest:
	@mocha --reporter spec --ui tdd --recursive lib --watch

.PHONY: lint test watchtest
