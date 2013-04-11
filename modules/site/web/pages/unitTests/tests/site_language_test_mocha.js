
	describe('site language', function(){
		 it('site language findAll', function(){
		    site.Language.findAll({},function(list){
console.log(list.length);
		    	chai.assert.equal(list.length,2);
		  	});
		 })
	})