comm_servicetest=require('../node_modules/comm_service.js');

var nodeunit = require('../node_modules/nodeunit');


exports['comm_servicetest'] = nodeunit.testCase({

    setUp: function () {
        // override variables and functions here
	
	req = new Object();
	res = new Object();
	req.is = function () { return true };
	req.headers = new Object();
	req.headers.accept = [];
	res.header = function () { return true };
	res.send = function () { return true };
	req.query = new Object();
	req.query.format = new Object();
	req.params = new Object();
	req.params.format = new Object();
	data = 'some data';
    },
    tearDown: function () {
        // reset all the overridden functions here
    },

	// before filling in the below sections, create a list of scenarios for the function you are testing as well as expected return values
    'comm_service sendSuccess successful1': function (test) {
        // call the function you are testing and use the following assert functions to check return values;
	//
	// ok(value, [message]) - Tests if value is a true value.
    	// equal(actual, expected, [message]) - Tests shallow, coercive equality with the equal comparison operator ( == ).
    	// notEqual(actual, expected, [message]) - Tests shallow, coercive non-equality with the not equal comparison operator ( != ).
    	// deepEqual(actual, expected, [message]) - Tests for deep equality.
    	// notDeepEqual(actual, expected, [message]) - Tests for any deep inequality.
    	// strictEqual(actual, expected, [message]) - Tests strict equality, as determined by the strict equality operator ( === )
    	// notStrictEqual(actual, expected, [message]) - Tests strict non-equality, as determined by the strict not equal operator ( !== )
    	// throws(block, [error], [message]) - Expects block to throw an error.
    	// doesNotThrow(block, [error], [message]) - Expects block not to throw an error.
    	// ifError(value) - Tests if value is not a false value, throws if it is a true value. 
	
        test.expect(1);
	var response = {
	        success:'true',
	        data: 'some data'
	    };
	
	var response_test = comm_servicetest.sendSuccess( req, res, data );
	
	test.deepEqual(response, response_test);
	test.done();

    },

    'test 2': function (test) {
        test.expect(0);

        // create as many tests as you require using the format in 'test 1' above.
	test.done();

    }

});

