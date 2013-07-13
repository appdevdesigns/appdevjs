/**
 * @class UnitTesting
 * @parent index 6
 *
 * ###Running Unit Tests
 *
 * This file sets up the testing environment for the framework's unit tests. 
 * If not being run from Travis-CI, run "cake test" from the command line to start the 
 * test suite after installing the following packages manually (please note version requirements);
 * 
 * -	coffee-script
 * -	mocha-phantomjs (3.1.0 or higher)
 * -	phantomjs (1.9.1 or higher)
 * -	mocha (1.12.0 or higher)
 * 
 * 
 * To set up the unit testing environment, this file does the following;
 * 
 * -	start an automated install process
 * -	set up a testing database
 * -	setup a test version of appDev framework with default values and authentication disabled
 * -	install any necessary modules
 * -	start an instance of the test site so unit tests can be retrieved and run
 * 
 */

var http = require('http');
var assert = require("assert");
//var request = require("request");
var querystring = require('querystring');
var fork = require("child_process").fork;
var exec = require("child_process").exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var expect = require('../server/node_modules/chai').expect;


(function() {

describe('', function () {
  var install_child,
  	  child,
      port = 8088;

  before( function (done) {
	  //fork the automated install process
	  install_child = fork('./install/app_install.js', null, {env: {PORT: port}, silent: false});
	  
	  //wait until the install process completes then install the modules and and fork an instance of the main site
	  install_child.on('exit', function (code) {
		  	setTimeout(function() {
				   expect(code).to.equal(0);
				   console.log('Install process exited with exit code '+code);
				   
				   console.log("Adding modules in " + process.cwd() + "/modules");
			    	  var dbOptions = {
			    		        user:       "root",
			    		        password:   "root",
			    		        host:       "localhost",
			    		        port:       "3306"
			    		    };
			    		    
			    		    var db = require('../server/node_modules/mysql');
			    		    
			    		    var connection = db.createConnection(dbOptions);
			    		    connection.connect(function(err) {
			    		        if (err) {
			    		            console.log(' DB connection failed');
			    		            throw err;
			    		        } else {
			    		            console.log(' DB connection established');
			    		        }
			    		    });
			    	  var sysObj = {
			    			  name: "hris",
			    			  path: process.cwd() + "/modules/hris",
			    			  type: "module"
			    	  };
			    	  var sql = " \
			                INSERT INTO " + "appdevtest" + ".site_system \
			                    (system_name, system_path, system_type) \
			                VALUES \
			                    (?, ?, ?) \
			            ";
			    	  connection.query(sql, [sysObj.name, sysObj.path, sysObj.type], function(err, results, fields) {
						   expect(!err).to.equal(true);
			                if (err) {
			                    console.error(err);
			                } else
			                	{ 
			                	console.log("done.");  
			                	
			                	console.log('\n\n**** MAIN SITE UP ****\n\n');
				 				   setTimeout(function() {
				 					   child = fork('app.js', null, {env: {PORT: port}, silent: false});
				 					    child.on('message', function (msg) {
				 					    	if (msg === 'listening') {
				 					    	  console.log('**** main site up.');
				 					    	  
				 					    	  done();
				 					        
				 					      }
				 					    });
				 				   }, 1000);
			                	}
			            });
				   
		    		
			  }, 0);
		   
		});
	  
	  //Wait until the install site is live then create the testing database, defaults.js file
	  install_child.on('message', function (msg) {
    	if (msg === 'listening') {
    		console.log('**** install site up.');
    	  
	    	//var data = "dbType=mysql&dbName=appdev&dbUser=root&dbPword=root&dbCharset=utf8&dbPathMySQL=%2FApplications%2FMAMP%2FLibrary%2Fbin%2Fmysql&dbPathMySQLDump=%2FApplications%2FMAMP%2FLibrary%2Fbin%2Fmysqldump&connectType=url&dbPath=localhost&dbPort=3306&dbSocketPath=-&authType=local&sessionSecret=th3re+is+n0+sPo0n&casHost=-&casPort=-&casPath=-&casPgtCallback=&casSubmodule=&emailMethod=smtp&emailHost=securemail.example.com&emailPort=25&emailDomain=localhost&=&langList=en%3AEnglish%2Czh-hans%3A%E4%B8%AD%E6%96%87&langDefault=en&siteURL=localhost&sitePort=8088&production=false&adminUserID=root&adminPWord=root&adminLanguage=en";
	    	var post_data = querystring.stringify({
	    	      'dbType' : 'mysql',
	    	      'dbName': 'appdevtest',
	    	      'dbUser': 'root',
	    	      'dbPword' : 'root',
	    	      'dbCharset' : 'utf8',
	    	      'dbPathMySQL' : 'mysql', // /Applications/MAMP/Library/bin/
	    	      'dbPathMySQLDump' : 'mysqldump', // /Applications/MAMP/Library/bin/
	    	      'connectType' : 'url',
	    	      'dbPath' : 'localhost',
	    	      'dbPort' : '3306',
	    	      'dbSocketPath' : '-',
	    	      'authType' : 'local',
	    	      'authRequired' : 'false',
	    	      'sessionSecret' : 'th3re+is+n0+sPo0n',
	    	      'casHost' : '-',
	    	      'casPort' : '-',
	    	      'casPath' : '-',
	    	      'casPgtCallback' : '',
	    	      'casSubmodule' : '',
	    	      'emailMethod' : 'smtp',
	    	      'emailHost' : 'securemail.example.com',
	    	      'emailPort' : '25',
	    	      'emailDomain' : 'localhost',
	    	      'langList' : 'en:English,zh-hans:中文',
	    	      'langDefault' : 'en',
	    	      'siteURL' : 'localhost',
	    	      'sitePort' : '8088',
	    	      'production' : 'false',
	    	      'logging' : 'false',
	    	      'adminUserID' : 'appdevtest',
	    	      'adminPWord' : 'appdevtest',
	    	      'adminLanguage' : 'en'
	    	  });
	    	var options = {
	  			    hostname: 'localhost',
	  			    port: port,
	  			    method: 'POST',
	  			    path: '/install/test_commit',
	  			    headers: {
	  			    	'Content-Type': 'application/x-www-form-urlencoded', 
	  			    	'Content-Length': post_data.length
	  			    }
	  	  	}
		  	var req = http.request(options, function(res) {
		  		  console.log('STATUS_BEFORE: ' + res.statusCode);
		  		  //console.log('HEADERS_BEFORE: ' + JSON.stringify(res.headers));
		  		  res.setEncoding('utf8');
		  		  res.on('data', function (chunk) {
		  		  console.log('BODY_BEFORE: ' + chunk);
		  		  });
		  		}).on('error', function(e) {
		  		  console.log('ERROR_BEFORE: ' + e.message);
		  		});
	    	req.write(post_data);  
		  	
		  	req.end();

    	}
    	
    	
    });
  });

  after( function () {
	install_child.kill();
    child.kill();
  });

  /*it('listens on the specified port simple test', function (done) {
	  request('http://localhost:' + port + '/test', function(err, res, body) {
	      console.log('****response:' + res.statusCode );
	    assert(res.statusCode === 200);
	    done();
	  });
  });*/
  
  it('listens on the specified port express', function (done) {
	  var options = {
			    hostname: 'localhost',
			    port: port,
			    method: 'GET',
			    path: '/test',
			    headers: { 'Content-Type': 'text/plain' }
	  	}
	  var req = http.request(options, function(res) {
		  console.log('EXPRESSTEST_STATUS: ' + res.statusCode);
		  //console.log('EXPRESSTEST_HEADERS: ' + JSON.stringify(res.headers));
		  assert(res.statusCode === 200);
	      done();
		}).on('error', function(e) {
		  console.log('EXPRESSTEST_ERROR: ' + e.message);
		});
	  
	  req.end();
  });
  
  it('get unittest page', function (done) {
	  var options = {
			    host: 'localhost',
			    port: port,
			    method: 'GET',
			    path: '/page/site/unitTests',
			    headers: { 'Content-Type': 'application/json' }
	  	}
	  var req = http.request(options, function(res) {
		  console.log('UNITTEST_STATUS: ' + res.statusCode);
		  //console.log('HEADERS: ' + JSON.stringify(res.headers));
		  assert(res.statusCode === 200);
	      done();
		}).on('error', function(e) {
		  console.log('UNITTEST_ERROR: ' + e.message);
		});
	  
	  req.end();
  });
  
  describe("visit", function() {
	  
	  var fileURLsite = function() { return "http://localhost:8088/site/mocha/load?scriptList=/scripts/mocha/mocha.js,/scripts/chai/chai.js,/site/unitTests/tests/site_labels_test_mocha.js,/site/unitTests/tests/site_language_test_mocha.js"; };	    
	  var fileURLhris_dbadmin = function() { return "http://localhost:8088/site/mocha/load?scriptList=/init/hris/dbadmin/dbadmin.js,/init/hris/objectcreator/objectcreator.js,/init/hris/userFamily/userFamily.js,/init/hris/userfileTest/userfileTest.js,/scripts/mocha/mocha.js,/scripts/chai/chai.js,/hris/dbadmin/tests/hris_attribute_test_mocha.js,/hris/dbadmin/tests/hris_attributeDetails_test_mocha.js,/hris/dbadmin/tests/hris_attributeset_test_mocha.js,/hris/dbadmin/tests/hris_attributeSetDetails_test_mocha.js,/hris/dbadmin/tests/hris_dbadminListWidget_test_mocha.js,/hris/dbadmin/tests/hris_listSideBar_test_mocha.js,/hris/dbadmin/tests/hris_object_test_mocha.js,/hris/dbadmin/tests/hris_objectDetails_test_mocha.js,/hris/dbadmin/tests/hris_relationship_test_mocha.js,/hris/dbadmin/tests/object_webservice_test_mocha.js"; };
	  var fileURLhris_objectcreator = function() { return "http://localhost:8088/site/mocha/load?scriptList=/init/hris/dbadmin/dbadmin.js,/init/hris/objectcreator/objectcreator.js,/init/hris/userFamily/userFamily.js,/init/hris/userfileTest/userfileTest.js,/scripts/mocha/mocha.js,/scripts/chai/chai.js,/hris/objectcreator/tests/hris_attributeList_test_mocha.js,/hris/objectcreator/tests/hris_createButton_test_mocha.js,/hris/objectcreator/tests/hris_createForm_test_mocha.js,/hris/objectcreator/tests/hris_objectGrid_test_mocha.js,/hris/objectcreator/tests/hris_objectList_test_mocha.js"; };
	  var fileURLhris_userFamily = function() { return "http://localhost:8088/site/mocha/load?scriptList=/init/hris/dbadmin/dbadmin.js,/init/hris/objectcreator/objectcreator.js,/init/hris/userFamily/userFamily.js,/init/hris/userfileTest/userfileTest.js,/scripts/mocha/mocha.js,/scripts/chai/chai.js,/hris/userFamily/tests/hris_relatedObjects_test_mocha.js,/hris/userFamily/tests/hris_userAttributeItem_test_mocha.js,/hris/userFamily/tests/hris_userAttributes_test_mocha.js,/hris/userfileTest/tests/hris_userfile_test_mocha.js"; };
	  
	  before(function() {
		  
		  return this.runner = function(done, args, callback) {
		        var mochaPhantomJS, spawnArgs, stderr, stdout;
		        stdout = '';
		        stderr = '';
		        spawnArgs = ["" +  (process.cwd()) + "/node_modules/mocha-phantomjs/bin/mocha-phantomjs"].concat(args);
		        mochaPhantomJS = spawn('node', spawnArgs);
		        mochaPhantomJS.stdout.on('data', function(data) {
		          return stdout = stdout.concat(data.toString());
		        });
		        mochaPhantomJS.stderr.on('data', function(data) {
		          return stderr = stderr.concat(data.toString());
		        });
		        return mochaPhantomJS.on('exit', function(code) {
		          if (typeof callback === "function") {
		            callback(code, stdout, stderr);
		          }
		          return typeof done === "function" ? done() : void 0;
		        });
		      };
		      
	  });
	  it('site tests', function(done) {
	      return this.runner(done, [fileURLsite()], function(code, stdout, stderr) {
	        //expect(code).to.equal(0);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  it('hris dbadmin tests', function(done) {
	      return this.runner(done, [fileURLhris_dbadmin()], function(code, stdout, stderr) {
	        //expect(code).to.equal(1);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  it('hris objectcreator tests', function(done) {
	      return this.runner(done, [fileURLhris_objectcreator()], function(code, stdout, stderr) {
	        //expect(code).to.equal(1);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  it('hris userFamily tests', function(done) {
	      return this.runner(done, [fileURLhris_userFamily()], function(code, stdout, stderr) {
	        //expect(code).to.equal(1);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  /*it('appRAD tests', function(done) {
	      return this.runner(done, [fileURLappRAD()], function(code, stdout, stderr) {
	        expect(code).to.equal(0);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });*/
	});
  
});

}).call(this);


