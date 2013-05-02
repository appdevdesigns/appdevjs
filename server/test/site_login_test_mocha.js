var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var expect = chai.expect;

describe('site login page', function(){
    it('should show a login page', function(){
        chai.request('http://localhost:8088')
        .get('/page/site/login').res(function(res) {
            expect(res).to.have.status(200);
        });
    });
    it('should have an authenticate web service', function() {
        chai.request('http://localhost:8088')
        .post('/service/site/login/authenticate').res(function(res) {
            expect(res).to.have.status(200);
        });
    });
    it('should not respond to /', function() {
        chai.request('http://localhost:8088')
        .get('/').res(function(res) {
            console.log(res);
            expect(res).to.have.status(404);
        });
    });
})
