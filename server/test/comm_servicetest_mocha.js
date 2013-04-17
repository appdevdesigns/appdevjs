var comm_servicetest=require('../comm_service.js');

var chai = require('../../web/scripts/chai');

var req = new Object();
var res = new Object();
var data;

before(function () {
        // override variables and functions here
	
	//req = new Object();
	//res = new Object();
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
});

it('testing comm_service.js sendSuccess',function(done){
	var response = {
	        success:'true',
	        data: 'some data'
	    };
	
	var response_test = comm_servicetest.sendSuccess( req, res, data, 'all okay' );
	
	chai.assert.deepEqual(response,response_test,'response equal each other');
	done();
});

it('testing comm_service.js sendError',function(done){
	var response = {
        success:'false',
        errorID:'150',  // unknown
        errorMSG:'Unknown. Something went wrong.',
        data:{}
	    };
	
	var response_test = comm_servicetest.sendError( req, res, {}, 'your fault' );
	
	chai.assert.deepEqual(response,response_test,'response equal each other');
	done();
});



