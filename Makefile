SRC = $(shell find . \( -name "*.js" \) -o \( -name node_modules -prune \) -type f | sort)

lint:
	@jshint ${SRC}

.PHONY: lint
