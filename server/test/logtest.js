logtest=require('../node_modules/log');

exports['log successful'] = function (test) {
	
	var req = new Object();
	var logFormat = 'cyan';
	var errorFormat = 'red+bold';	
	var message = "this is a test";
	logtest.log( req, message );
	var lastin = req.aRAD.log.pop();
	
	test.equal("this is a test", lastin["message"]);
	test.equal(" info  - ", lastin["prefix"]);
	test.equal("cyan", lastin["format"]);

    test.done();
};

exports['log message undefined'] = function (test) {
	
	var req = new Object();
	var logFormat = 'cyan';
	var errorFormat = 'red+bold';	
	
	test.throws(function () { logtest.log( req, message ); });

    test.done();
};


exports['log dump successful'] = function (test) {
	
	var req = new Object();
	var logFormat = 'cyan';
	var errorFormat = 'red+bold';	
	var message = "this is a test";
	logtest.logDump( req, message );
	var logdump = req.aRAD.log;
	
	test.equal(0, logdump.length);

    test.done();
};

exports['log dump message undefined'] = function (test) {
	
	var req = new Object();
	var logFormat = 'cyan';
	var errorFormat = 'red+bold';	
	
	test.throws(function () { logtest.logDump( req, message ); });

    test.done();
};
