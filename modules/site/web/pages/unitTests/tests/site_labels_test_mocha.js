
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
		 })

		it('site labels findOne', function(done){
		    site.Labels.findOne({label_id:labelId},function(data){
		    	var findOneId = data.getID();
		    	chai.expect(findOneId).to.equal(labelId);
		    	done();
		  	});
		 })

		 it('site labels destroy', function(done){
			 label.destroy(function(data){
				 site.Labels.findAll({},function(list){
					 chai.assert.deepEqual(list.length,377);
					 done();
				 })
			 })
		 })

		 it('site labels findAll', function(done){
		    site.Labels.findAll({},function(list){

                chai.assert.deepEqual(list.length,377);
		    	done();
		  	});
		 })
	})
