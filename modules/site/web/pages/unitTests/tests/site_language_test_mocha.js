
	describe('site language', function(){
		 it('site language findAll', function(){
		    site.Language.findAll({},function(list){
		    	chai.assert.deepEqual(list.length,2);
		  	});
		 })
	})