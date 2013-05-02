var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../../app.js');
chai.use(chaiHttp);

var expect = chai.expect;

describe('site login page', function(){
    it('should show a login page', function(){
        chai.request(app)
        .get('/page/site/login').res(function(res) {
            expect(res).to.have.status(200);
        });
    });
    it('should have an authenticate web service', function() {
        chai.request(app)
        .post('/service/site/login/authenticate').res(function(res) {
            expect(res).to.have.status(200);
        });
    });
    it('should not respond to /', function() {
        chai.request(app)
        .get('/').res(function(res) {
            console.log(res);
            expect(res).to.have.status(404);
        });
    });
})
