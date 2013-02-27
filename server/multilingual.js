////
//// Multilingual
////
//// Our multilingual Label implementation
////
//// We store our multilingual labels in a data store: [mysql], [mongoDB], 
////
//// Labels are referenced by a unique Path/Key combo:
////    id:
////    path:
////    key:
////    language_code
////    label_key
////    label
////    

var url = require('url');

var loadedLabels = {};

var db = AD.Model.Datastore.DB;
var Log = AD.Util.Log;

//------------------------------------------------------------
var LabelObj = function ( options ) {
    // an object to manage returning Labels to our Interface 
    // templates.
    

    this.langKey = 'en';
    this.labels = {};
    this.missing = [];
    
    for (var i in options) {
    
        this[i] = options[i];
    }
}


// Takes the labels from another LabelObj and merges them into this
// object.
LabelObj.prototype.merge = function(otherObj) {
    for (var i in otherObj.labels) {
    	if (typeof this.labels[i] == 'undefined') this.labels[i] = otherObj.labels[i];
    	else {
    		
    		for (var ii in otherObj.labels[i]) {
    			this.labels[i][ii] = otherObj.labels[i][ii];
    		}
    		
    	}
        
    }
}



//Make a copy of this object.
LabelObj.prototype.copy = function() {
	var temp = {};
	temp.langKey = this.langKey;
	temp.missing = this.missing;
	temp.labels = {}
	
	for( var i in this.labels) {
		temp.labels[i] = {};
		for (var ii in this.labels[i]) {
			temp.labels[i][ii] = {};
			for (var iii in this.labels[i][ii]) {
				temp.labels[i][ii][iii] = this.labels[i][ii][iii];
			}
		}
	}
	
	return new LabelObj(temp);
}


LabelObj.prototype.getLabel = function (key, attr) {

    if (typeof attr == 'undefined') attr = {};
    
    var tag = '<span ';
    var options = 'class="appLabel" key="'+key+'" langKey="'+this.langKey+'" ';
    var attrStr = '';
    for (var a in attr) {
        attrStr += a+'="'+attr[a]+'" ';
    }
    if (typeof this.labels[this.langKey] != 'undefined') {
        if (typeof this.labels[this.langKey][key] != 'undefined') {
            // Found the label
            var obj = this.labels[this.langKey][key];
            for (var i in obj) {
                options += i+'="'+ obj[i] + '" ';
            }
            
            return tag+options+attrStr+'>'+this.labels[this.langKey][key].label+'</span>';
        } else {
            // Label key not found
            if (this.missing.indexOf(key) < 0) {
                this.missing.push(key);
            }

            return tag+attrStr+' error="labelNotFound['+key+']" >'+key+'</span>';
        }
    } else {
        // No labels in current language are loaded
        if (this.missing.indexOf(key) < 0) {
            this.missing.push(key);
        }
        return tag+attrStr+'>['+this.langKey+']? '+key+'</span>';
    }

}



LabelObj.prototype.getLabelRaw = function (key) {


    if (typeof this.labels[this.langKey] != 'undefined') {
        if (typeof this.labels[this.langKey][key] != 'undefined') {
            return this.labels[this.langKey][key].label;
        } else {
            if (this.missing.indexOf(key) < 0) {
                this.missing.push(key);
            }
            return '?['+key+']';
        }
    } else {
        if (this.missing.indexOf(key) < 0) {
            this.missing.push(key);
        }
        return '['+this.langKey+']? '+key;
    }

}




//------------------------------------------------------------
exports.loadLabelsByPath = function (req, res, next, path) {
    // load label information for the req.url path
    // label information is stored in the req.aRAD.response.labels
    // object.
	//
	// This method can be called in 3 ways:
	//	  if path given:  load the labels with the given path
	//	  else if req.aRAD.response.listLabelPaths has any paths, then load ALL of those
	//	  else just find a path from our req.url and load any labels associated with that

	var listPaths = [];
	
	// if no path given:
    if (!path) {
    	
    	// if a listLabelPaths is set in req.aRAD.response then
    	if (typeof req.aRAD.response.listLabelPaths != 'undefined') {

    		// grab all those labels:
    		listPaths = req.aRAD.response.listLabelPaths;
    		
    	} else {
    		
    		// just grab based on our url:
    		path = url.parse(req.url).pathname;
    		listPaths.push(path);
    	}
    	
    } else {
    	
    	// use the path that was given
    	listPaths.push(path);
    }
    
    listPaths.push('/site/common');  // we include our shared site labels that can be reused among any source:  'Add', 'Delete', 'Submit', etc... 
    
    //// make a list of all paths that haven't been cached
	var whereValues = [];
	
	// for all the paths we are loading
	for(var i=0; i<listPaths.length; i++ ) {
		
		// if this path isn't cached then
		var path = listPaths[i];
		if (typeof loadedLabels[path] == 'undefined') {
			
			// add this path to what we need to lookup
			whereValues.push(listPaths[i]);
			
		} else {

			// this path is already been cached, so reuse:
			if (req.aRAD.response.labels) {
	            req.aRAD.response.labels.merge(loadedLabels[path]);
	        } else {

	        	// yes make a copy() so the original doesn't get all the 
	        	// additional entries merge() into it.
	            req.aRAD.response.labels = loadedLabels[path].copy();
	        }
			
		}

	}

	// by this point we have all our cached paths placed into req.aRAD.response.labels
    
	// if we had any uncached paths 
    if (whereValues.length > 0) {
    	
    	var numCompleted = 0;  // count the number of finished DB queries
    	
    	
    	// foreach uncached path
    	for(var wi=0; wi<whereValues.length; wi++) {
    		
    		
    		// run a DB query to lookup that path
    		var values = [whereValues[wi]];
    		var sql = ' SELECT * FROM '+AD.Defaults.dbName+'.site_multilingual_label WHERE label_path=?';
    		db.query(sql, values, function (err, results, fields) {
    	        
                if (err) Log(req, err);

                
                // if there were labels associated with this path
                if (results.length > 0) {
                	
                
                	// transform the results into a LabelObj();
	                var labels = {};
	                var currPath = '';
	
	                for(var ri in results) {
	                
	                    var langKey = results[ri].language_code;
	                    var labelKey = results[ri].label_key;
	                    
	                    if (!(langKey  in labels) ) {
	                        labels[ langKey ] = {};
	                    }
	                    
	                    labels[langKey][labelKey] = {
	                        label:results[ri].label_label,
	                        labelID:results[ri].label_id,
	                        path:results[ri].label_path
	                    };
	                    
	                    currPath = results[ri].label_path;
	                }
	                loadedLabels[currPath] = new LabelObj( {labels:labels} );
	                
	                
	                // add this to our response.labels object
	                if (req.aRAD.response.labels) {
	                    req.aRAD.response.labels.merge(loadedLabels[currPath]);
	                } else {
	                	// yes we do want to make a new *temp* LabelObj
	                	// all the merging above actually addes to the existing entry
	                    req.aRAD.response.labels = new LabelObj( {labels:labels} );
	                }    
	                
	                
                }  // end if results.length > 0
                
                
                // only continue if all our callbacks have executed:
                numCompleted ++;
                if (numCompleted >= whereValues.length){
                	next();
                }
            
            });
    		
    	} // next uncached path

   
    } else {
    
    	// we've already loaded all our label paths
        next();
    
    }

}




var listLanguages = [];
exports.listLanguages = listLanguages;

exports.loadLanguages = function (req, res, next) {
/// return a label object for the given path


    if (listLanguages.length == 0) {
//// TODO: shouldn't we use the Model Object here?

        var sql = ' SELECT * FROM '+AD.Defaults.dbName+'.site_multilingual_language';

        db.query(sql, [], function (err, results, fields) {
        
            if (err) console.log(err);


            for(var ri in results) {
            
                var code = results[ri].language_code;
                var label = results[ri].language_label;
                
                listLanguages.push({ language_code:code, language_label:label});
            }
        

AD.Lang.listLanguages = listLanguages;
            req.aRAD.response.listLanguages = listLanguages;
            next();
        
        });

    
    
    } else {
    
        // we've already loaded our languageList, just store that.
        
        req.aRAD.response.listLanguages = listLanguages;
        next();
    
    }

}




//
// Clear labels when Labels are changed:
//
var flushLabels = function() {
	loadedLabels = {};
}
AD.Comm.Notification.subscribe('site.label.changed', flushLabels);
