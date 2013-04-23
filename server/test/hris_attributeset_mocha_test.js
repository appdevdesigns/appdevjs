var chai = require('../../web/scripts/chai');
var hris_attributeset = require('../../modules/hris/web/pages/dbadmin/scripts/APIAttributeset.js');
//var jQuery = require('../../web/scripts/jquery/jquery.js');
//var string = require('../../web/scripts/jquery/lang/string/string.js');
/*/scripts/jquery/controller/subscribe/subscribe.js');
    listUrls.push('/scripts/jquery/view/ejs/ejs.js');
    listUrls.push('/scripts/jquery/controller/view/view.js');
    listUrls.push('/scripts/jquery/model/model.js');
    listUrls.push('/scripts/jquery/dom/fixture/fixture.js');
    listUrls.push('/scripts/jquery/dom/form_params/form_params.js');
    listUrls.push('/scripts/jquery/event/event.js');
    listUrls.push('/scripts/jquery/event/destroyed/destroyed.js');
    listUrls.push('/scripts/jquery/lang/object/object.js');
    listUrls.push('/scripts/jquery/lang/string/rsplit/rsplit.js');
    listUrls.push('/scripts/jquery/dom/dom.js');
    listUrls.push('/scripts/jquery/class/class.js');
    listUrls.push('/scripts/jquery/controller/controller.js');
    listUrls.push('/scripts/jquery/view/view.js');
    listUrls.push('/scripts/jquery/lang/openajax/openajax.js');
    listUrls.push('/scripts/base.min.js');
	listUrls.push('/appDev/appDev.js');*/

	describe('Web Service: AttributeSet', function(){
	
	
	   var attributeSetID = -1;  // using this to pull specific objects after diferent tests run in sequence
	   
        // make sure Attributeset's table is empty before running tests
        before(function(done) {
                
            console.log('beforeEach called...');
            hris.APIAttributeset.findAll({},function(list){

                var listDFD = [];
                for (var i=0; i<list.length; i++) {
                    listDFD.push(list[i].destroy());
                }
                
                $.when.apply($, listDFD).then(function() {
                     console.log('done called...');
		    	     done();
		    	});
		  	});
		  	
        });
            
            
		 it('Attributeset Table is Empty', function(done){
		    
		    hris.APIAttributeset.findAll({},function(list){
		    	chai.assert.equal(list.length,0, 'list should be empty.');
		    	done();
		  	});
		  	
		 })
		 
		 
		 it('Attributeset.save() prevent empty values', function(done){

            // attempting to save empty data is an Error
		    hris.APIAttributeset.create({}, function(object) {
		    
                // this should not have been allowed.
                chai.assert.isTrue(false, 'should not have saved empty values');    
                done();
            },function(err) {
            
                // error is properly caught
                chai.assert.isTrue(true, 'prevented  saving empty values');
                done();
            });
                        
		  	
		 });
		 
		 
		 
		 it('Attributeset.save() require all fields for save', function(done){


			attributeSet = {
					type_id: 1,
					object_id: 1,
					attributeset_table: 'test_attributeset_table',
					attributeset_relation: 'many',
					attributeset_uniqueKey: 0,
					attributeset_key: 'test_attributeset_key',
					attributeset_pkey: 'test_attributeset_pkey',
					attributeset_label: 'test attributeset'
			};
            // attempting to save without an object_key is an Error
		    hris.APIAttributeset.create(attributeSet, function(attributeset) {
		    
                if ($.isArray(attributeset)) {
                	attributeSetID = attributeset[0].attributeset_id;
                } else {
                	attributeSetID = attributeset.attributeset_id;
                }
		    
                chai.assert.isTrue(true, 'should save attributeset ');    
                done();
            },function(err) {
            
                // error is properly caught
                chai.assert.isTrue(false, 'did not save attributeset ');
                done();
            });
                        
		  	
		 });
		 
		 
		 
		 // 
		 it('Attributeset.findOne() can find recently added entry', function(done){


            // attempting to save empty data is an Error
		    hris.APIAttributeset.findOne({ attributeset_id:attributeSetID}, function(data) {
		    
                var attrs = {};
                var testKeyOnly= {
                    attributeset_id: attributeSetID,
					type_id: 1,
					object_id: 1,
					attributeset_table: 'test_attributeset_table',
					attributeset_relation: 'many',
					attributeset_uniqueKey: 0,
					attributeset_key: 'test_attributeset_key',
					attributeset_pkey: 'test_attributeset_pkey',
					attributeset_label: 'test attributeset'
                }
                
                for (var t in testKeyOnly) {
                    attrs[t] = data.attr(t);
                }
                
                // this should not have been allowed.
                chai.assert.deepEqual(attrs, testKeyOnly, ' attributeset has expected initial values');    
                done();
                
            },function(err) {
            
                // error is properly caught
                chai.assert.isTrue(false, 'couldnt find recently added entry by id:'+attributeSetID);
                done();
            });
                        
		  	
		 });
	})