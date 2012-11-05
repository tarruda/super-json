TESTS = ./test/custom-json.js

test:
	@./node_modules/.bin/mocha -u tdd --require should $(TESTS) 

pack: test
	npm pack

.PHONY: test
