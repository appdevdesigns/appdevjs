var links = [];
var casper = require('casper').create();

function getLinks() {
    var links = document.querySelectorAll('h3.r a');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href')
    });
}

casper.start('http://localhost:8088/page/site/unitTests', function() {
    // search for 'casperjs' from google form
});

casper.evaluate(function() {
    // aggregate results for the 'casperjs' search
    //links = this.evaluate(getLinks);
    // now search for 'phantomjs' by filling the form again
    document.querySelector('#userID').value = 'admin';
	document.querySelector('#pWord').value = 'admin';
	document.querySelector('#submit').submit();
	//this.clickLabel('Submit','button');
});

casper.then(function(term) {
    // aggregate results for the 'casperjs' search
    //links = this.evaluate(getLinks);
    // now search for 'phantomjs' by filling the form again
	//document.querySelector('li')
	//document.querySelector('input[name="submit"]').submit();
	//this.clickLabel('Submit','button');
});

casper.run();