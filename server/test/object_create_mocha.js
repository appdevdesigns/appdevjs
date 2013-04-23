var path = require('path');
fs = require('fs');
__appdevPath = path.join(__dirname,'..','..');
__appdevPathNode = __appdevPath + '/server/node_modules/';
//console.log('__appdevPath = '+__appdevPath);
var AD = require('../AD.js');
AD.steal = require('../node-steal.js');
//var AppDev = require('../../web/appDev/appDev.js');
var app_servicetest=require('../app_service.js');

var chai = require('../../web/scripts/chai');

var req = new Object();
var res = new Object();
var data;

before(function () {

});

it('testing comm_service.js sendSuccess',function(done){
	app_servicetest.Service({});
	//app_servicetest.Service.prototype.setupSiteAPI();
	done();
});

it('testing comm_service.js sendError',function(done){
	done();
});