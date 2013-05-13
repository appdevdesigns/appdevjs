var expect = chai.expect;

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
