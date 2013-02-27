	 
	describe('site labels', function(){
		 it('site labels findAll', function(){
		    site.Labels.findAll({},function(list){
		    	chai.assert.deepEqual(list.length,156);
		  	});
		 })
	})
