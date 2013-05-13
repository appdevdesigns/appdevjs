var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../app.js');
var $ = require('../AD.js').jQuery;

chai.use(chaiHttp);

var expect = chai.expect;

var testTarget = app;
//var testTarget = 'http://localhost:8088';

describe('site login page', function(){
    before(function(done) {
       $.when(app.$siteOnline).then( function() {
        done();
       });
    });
    it('should show a login page', function(done){
        chai.request(testTarget)
        .get('/page/site/login').res(function(res) {
            expect(res).to.have.status(200);
            done();
        });
    });
    it('should have an authenticate web service', function(done) {
        chai.request(testTarget)
        .post('/service/site/login/authenticate').res(function(res) {
            expect(res).to.have.status(200);
            done();
        });
    });
    it('should not respond to /', function(done) {
        chai.request(testTarget)
        .get('/').res(function(res) {
            expect(res).to.have.status(404);
            done();
        });
    });
})
