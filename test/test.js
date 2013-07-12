var http = require('http');
var assert = require("assert");
//var request = require("request");
var querystring = require('querystring');
var fork = require("child_process").fork;
var exec = require("child_process").exec;
var spawn = require('child_process').spawn;
var fs = require('fs');

(function() {

describe('', function () {
  var install_child,
  	  child,
      port = 8088;

  before( function (done) {
	  install_child = fork('./install/app_install.js', null, {env: {PORT: port}});
	  
	  install_child.on('exit', function (code) {
		  	setTimeout(function() {
				   console.log('Install process exited with exit code '+code);
				   console.log('\n\n**** MAIN SITE TURN ON ****\n\n');
				   setTimeout(function() {
					   child = fork('app.js', null, {env: {PORT: port}});
					    child.on('message', function (msg) {
					    	if (msg === 'listening') {
					    	  console.log('**** main site up.');
					        done();
					      }
					    });
				   }, 1000);
		    		
			  }, 0);
		   
		});
	  
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
	    	      'dbPathMySQL' : 'mysql',
	    	      'dbPathMySQLDump' : 'mysqldump',
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
	  
	  var expect = require('../server/node_modules/chai').expect;
	  var fileURL = function() { return "http://localhost:8088/site/mocha/load?scriptList=/scripts/mocha/mocha.js,/scripts/chai/chai.js,/site/unitTests/tests/site_labels_test_mocha.js"; };	    
	  var fileURL2 = function() { return "http://localhost:8088/site/mocha/load?scriptList=/scripts/mocha/mocha.js,/scripts/chai/chai.js,/site/unitTests/tests/site_language_test_mocha.js"; };
	  var fileURL3 = function() { return "http://localhost:8088/site/mocha/load?scriptList=/scripts/mocha/mocha.js,/scripts/chai/chai.js,/hris/tests/hris_attribute_test_mocha.js"; };

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
	  it('label tests', function(done) {
	      return this.runner(done, [fileURL()], function(code, stdout, stderr) {
	        expect(code).to.equal(0);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  it('language tests', function(done) {
	      return this.runner(done, [fileURL2()], function(code, stdout, stderr) {
	        expect(code).to.equal(0);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });
	  /*it('hris attribute tests', function(done) {
	      return this.runner(done, [fileURL3()], function(code, stdout, stderr) {
	        expect(code).to.equal(0);
	  	  	console.log(stdout);
	        return expect(stdout).to.match(/./i);
	      });
	    });*/
	});
  
});

}).call(this);


