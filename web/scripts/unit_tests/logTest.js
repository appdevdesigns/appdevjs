
function LogTest( name )
{
    TestCase.call( this, name );
}
function LogTest_setUp()
{
    this.fValue1= 2;
} 
function LogTest_testAsserts()
{
//require(["log.js", "logTest.js"], function(someModule) {
    var lg = exports.log;
	var req = new Object();
	//req.aRAD = {};
	//req.aRAD.log = [];
	//var color = require('ansi-color').set;
	var logFormat = 'cyan';
	var errorFormat = 'red+bold';	
	var message = "this is a test";
	log( req, message );
	var lastin = req.aRAD.log.pop();
	this.assertEquals("this is a test", lastin["message"]);
	this.assertEquals(" info  - ", lastin["prefix"]);
	this.assertUndefined(lastin["format"]);
//});
}
LogTest.prototype = new TestCase();
LogTest.glue();


function LogTestSuite()
{
    TestSuite.call( this, "LogTestSuite" );
    this.addTestSuite( LogTest );
}
LogTestSuite.prototype = new TestSuite();
LogTestSuite.prototype.suite = function () { return new LogTestSuite(); }

