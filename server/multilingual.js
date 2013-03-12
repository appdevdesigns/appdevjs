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

/*
 * @class AD_Server.Lang
 * @parent AD_Server
 * 
 * Shared resources related to Language.
 * 
 * AD.Lang : our multilingual tools.
 */

var url = require('url');

var loadedLabels = {};

var db = AD.Model.Datastore.DB;
var Log = AD.Util.Log;
var $ = AD.jQuery;





//------------------------------------------------------------
/**
 * @function labelsForPath
 * 
 * return a LabelObj that contains the labels for the given path.
 * This is meant to be called directly from the AD.Lang  object.
 * 
 * The result of this call is a LangObj that can be used to manage
 * your labels.
 * 
 * This is an Asynchronous method.
 * 
 * You can use it like this:
 * @codestart
 * var moduleLabels = null;
 * var loaded = AD.Lang.labelsForPath('/module/common');
 * $.when(loaded)
 *      .then(function(labelObj) {
 *          moduleLabels = labelObj;
 *          var errorMsg = moduleLabels.label('[module.Error]');
 *      })
 *      .fail(function(err) {
 *      
 *      });
 * @codeend
 * 
 * @param {string} path  The label_path of the labels you want to load.
 * @param {fn} onSuccess An optional callback to call with the object.
 * @param {fn} onError An optional callback to call in the event of an error.
 * @return {deferred} 
 */
exports.labelsForPath = function(path, onSuccess, onError) {
    // a server side script to return a LabelObj that contains 
    // the labels for a series for a path:
    
    var dfd = $.Deferred();
    
    // we are going to reuse the express fn() so we need to simulate
    // the req, res, next, path parameters:
    var req = { aRAD: {response:{}}};
    var res = {};
    loadLabelsByPath(req, res, function() {
        
        // ok, now the labels object is hidden in: req.aRAD.response.labels
        var labels = req.aRAD.response.labels;
        
        if (onSuccess) onSuccess(labels);
        dfd.resolve(labels);
        
    }, path);
    
    
    return dfd;
}



//------------------------------------------------------------
/**
 * @function loadLabelsByPath
 * 
 * An express route fn used to load the labels associated with
 * the current route/path.
 * 
 * This is an Asynchronous method.
 * 
 * This method is used in several ways:
 * 
 * #### Option 1: with a provided path
 * @codestart
 * var expressStep = function(req, res, next) {
 * 
 *      var path = '/myModule/page';
 *      AD.Lang.loadLabelsByPath(req, res, next, path);
 * }
 * @codeend
 * 
 * 
 * #### Option 2: load the req obj with a list of paths to find
 * @codestart
 * var expressStep = function(req, res, next) {
 * 
 *      var req.aRAD.response.listLabelPaths = [ '/myModule/page', 'site/common',...];
 *      AD.Lang.loadLabelsByPath(req, res, next, path);
 * }
 * @codeend
 * 
 * #### Option 3: call as is, and it will attempt to use the req.url for the path
 * @codestart
 * var expressStep = function(req, res, next) {
 * 
 *      // my url is: /myModule/page   <-- that is the path
 *      AD.Lang.loadLabelsByPath(req, res, next);
 * }
 * @codeend
 * 
 * 
 * In all cases, the routine will place a LabelObj in req.aRAD.response.labels so that
 * our server side templates can access them as:  data.labels;
 * 
 * @param {obj} req  The Express Request object
 * @param {obj} res  The Express Response object
 * @param {obj} next The Express next() 
 * @param {string} path  An optional label_path of the labels you want to load.
 */
var loadLabelsByPath = function (req, res, next, path) {
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
exports.loadLabelsByPath = loadLabelsByPath;



var listLanguages = [];
//------------------------------------------------------------
/**
 * @property listLanguages
 * 
 * Is an array the installed languages.
 * 
 * This array is in this format:
 * @codestart
 * AD.Lang.listLanguages = [
 *      { language_code:'code', language_label:'label'},
 *      { language_code:'en',  language_label:'English'},
 *      ...
 *      { language_code:'codeN', language_label:'labelN' }
 * ];
 * @codeend
 *  
 */
exports.listLanguages = listLanguages;



//------------------------------------------------------------
/**
 * @property loadLanguages
 * 
 * An express route helper function designed to make sure the list
 * of possible languages are stored in the req.aRAD.response.listLanguages
 * parameter.
 * 
 *  @param {object} req  The Express request object
 *  @param {object} res  The Express response object
 *  @param {fn} next The Express next() function
 */
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



//------------------------------------------------------------
/*
 * @class AD_Server.Lang.LabelObj
 * @parent AD_Server.Lang
 * 
 * The LabelObj is responsible for managing a set of multilingual
 * labels.
 * 
 * You typically get a version of this object from one of the 
 * AD.Lang.* methods:
 * * AD.Lang.labelsForPath(path) : returns a LabelObj directly
 * * AD.Lang.loadLabelsByPath(req, res, next, path) : embedds a LabelObj in the req object
 * 
 */
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



/**
 * @function getLabel
 * 
 * Return an HTML formatted label to be displayed on a web page.
 * 
 * This is usually what is used in our EJS templates that are returned to the
 * web client.  
 * 
 * (note: inside our EJS templates the labelObj is accessed as data.labels)
 * 
 * @codestart
 * &lt;ul id="myTab" class="nav nav-tabs">
 *    &lt;li class="">&lt;a href="#module-install" data-toggle="tab">&lt;%- data.labels.getLabel('[apprad.portal.install]') %>&lt;/a>&lt;/li>
 * &lt;/ul>
 * @codeend
 * 
 * This routine returns a &lt;span> element with the label in it. It should look like:
 * @codestart
 * &lt;span class="appLabel" key="label_key" langKey="language_code"> label_label &lt;/span>
 * @codeend
 * 
 * @param {string} key  The label_key of the label you want to display.
 * @param {obj} attr  An optional set of attributes to add to the displayed &lt;span> element.
 * @return {string} 
 */
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



/**
 * @function label
 * 
 * When used outside of a template, this is the method you want to use.  It returns the 
 * simple label for your provided key.
 * 
 * @codestart
 * var errorLabels = null;
 * var labelsLoaded = AD.Lang.labelsForPath('/hris/errors');
 * $.when(labelsLoaded)
 *  .then(function(labels) {
 *        errorLabels = labels;
 *        var label = errorLabels.label('[module.Key]', 'en');
 *   });
 * @codeend
 *
 * @param {string} key  The label_key of the label you want to display.
 * @param {string} langKey  (optional) the language_code of the label you want to use.
 * @return {string} 
 */
LabelObj.prototype.label = function(key, langKey) {
    return this.getLabelRaw(key, langKey);
}
LabelObj.prototype.getLabelRaw = function (key, langKey) {

    if ('undefined' == typeof langKey) langKey = this.langKey;
    
    if (typeof this.labels[langKey] != 'undefined') {
        if (typeof this.labels[langKey][key] != 'undefined') {
            return this.labels[langKey][key].label;
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
        return '['+langKey+']? '+key;
    }

}



//
// Clear labels when Labels are changed:
//
var flushLabels = function() {
	loadedLabels = {};
}
AD.Comm.Notification.subscribe('site.label.changed', flushLabels);
