var http = require('http');
var assert = require("assert");
//var request = require("request");
var querystring = require('querystring');
//var steal = require("../server/node-steal.js");
//var AD = require("../web/appDev/appDev.js");
var fork = require("child_process").fork;
var fs = require('fs');

describe('testapp', function () {
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
	    	      'langList' : 'en:English',
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
    	
    	if (msg === 'closed') {
    		
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
  
  it('get Labels findall', function (done) {

	  var str = '';
	  var scriptList = [];
	  scriptList.push('/scripts/mocha/mocha.js');
	  scriptList.push('/scripts/chai/chai.js');
	  scriptList.push('/site/unitTests/tests/site_labels_test_mocha.js');
	  var options = {
			    host: 'localhost',
			    port: port,
			    method: 'GET',
			    path: '/site/mocha/load?scriptList=' + scriptList,
			    headers: { 'Content-Type': 'text/plain' }
	  	}
	  var req = http.request(options, function(res) {
		  console.log('MOCHATEST_STATUS: ' + res.statusCode);
		  
		  res.on('data', function (chunk) {
			    str += chunk;
			  });
		  
		  res.on('end', function () {
		        //console.log(str);
			  
		        fs.writeFileSync("./test/test_tmp.html", str)
		    	//var result = execSync("mocha-phantomjs ./test/test_tmp.html");
				//console.log(result);
			  	
			  });
		  
		  //console.log('HEADERS: ' + JSON.stringify(res.headers));
		  assert(res.statusCode === 200);
	      done();
		}).on('error', function(e) {
		  console.log('MOCHATEST_ERROR: ' + e.message);
		});

	  req.end();
  });
  
  /*
  describe('site labels', function(){
	  
	    var label = new site.Labels({});
	    var labelId = 0;
	    before(function(done){
	        label = new site.Labels({
	            language_code: 'en',
	            label_key: '[testing.add.of.label]',
	            label_label: 'Testing',
	            label_lastMod: '2013-04-03 08:01:01',
	            label_needs_translation: 0,
	            label_path: '/page/site/adminToolbar'
	        });
	        label.save(function(){
	            labelId = label.getID();
	            done();
	        });
	    });

	    it('should have a label_key', function() {
	        expect(label.label_key).to.equal('[testing.add.of.label]');
	    });
	    it('should have a language_code', function() {
	        expect(label.language_code).to.equal('en');
	    });
	    it('should have a label_label', function() {
	        expect(label.label_label).to.equal( 'Testing');
	    });
	    it('should have a label_lastMod', function() {
	        expect(label.label_lastMod).to.equal( '2013-04-03 08:01:01');
	    });
	    it('should have a label_needs_translation', function() {
	        expect(label.label_needs_translation).to.equal( 0);
	    });
	    it('should have a label_path', function() {
	        expect(label.label_path).to.equal( '/page/site/adminToolbar');
	    });

	    describe('site labels findOne', function(){
	        it('when label_id is specified', function(done) {
	            site.Labels.findOne({label_id:labelId},function(data){
	                var findOneId = data.getID();
	                expect(findOneId).to.equal(labelId);
	                done();
	            });
	        });
	    });
	    it.skip('site labels destroy', function(done){
	        label.destroy(function(data){
	            site.Labels.findAll({},function(list){
	                chai.assert.deepEqual(list.length,344);
	                done();
	            })
	        });
	    });
	    it.skip('site labels findAll', function(done){
	       site.Labels.findAll({},function(list){
	           chai.assert.deepEqual(list.length,344);
	           done();
	       });
	    });

	  });
  

/*
  describe('language', function() {
	    var language;
	    before(function(done){
	        var _done = done;
	        site.Language.findAll({}, function(list){
	            language = list[0];
	            _done();
	        });
	    });
	    it('should have a language_code', function() {
	        expect(language.language_code).to.exist;
	    });
	    it('should have a language_id', function() {
	        expect(language.language_id).to.exist;
	    });
	    it('should have a language_label', function() {
	        expect(language.language_label).to.exist;
	    });
		describe('preinstalled site languages', function(){
			it('should be 2 installed', function(){
			    site.Language.findAll({},function(list){
			    	chai.assert.equal(list.length,2);
			  	});
			});
		});
	    describe('site.Language.findAll', function(){
	        it('should return an array', function(){
	            site.Language.findAll({},function(list){
	                expect(list).to.be.instanceof(Array);
	            });
	        });
	    })
	    describe('AD.Lang.getList', function(){
	        it('should return an array', function() {
	            AD.Lang.getList(function(list){
	                expect(list).to.be.instanceof(Array);
	            });
	        });
	    });
	});
  */
  //
});



