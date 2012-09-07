SRC = $(shell find . -name "*.js" -type f | sort)

lint:
	@jshint ${SRC}

.PHONY: lint
