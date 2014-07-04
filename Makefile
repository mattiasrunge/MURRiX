SRC = $(shell find . -name "*.js" -o \( -name node_modules -o -name bower_components -o -name old \) -prune -type f | sort)

lint:
	@jshint ${SRC}
	
style: configure
	./node_modules/jscs/bin/jscs ${SRC}

test: configure
	@mocha --reporter spec --ui tdd --recursive lib

watchtest: configure
	@mocha --reporter spec --ui tdd --recursive lib --watch

configure:
	npm install
	cd client
	./node_modules/bower/bin/bower install
	
.PHONY: lint test watchtest style configure
