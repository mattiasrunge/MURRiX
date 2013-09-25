SRC = $(shell find . \( -name "*.js" \) -o \( -name node_modules -prune \) -type f | sort)

lint:
	@jshint ${SRC}

test:
	@mocha --reporter spec --ui tdd --recursive lib

.PHONY: lint test
