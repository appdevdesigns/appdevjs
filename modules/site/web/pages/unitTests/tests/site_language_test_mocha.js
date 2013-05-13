var expect = chai.expect;

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
