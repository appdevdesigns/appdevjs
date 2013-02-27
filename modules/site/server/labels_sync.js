//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   labels    : the name of this service :  (lowercase)
//   Labels    : the name of this service :  (Uppercase)
//   sync	  : the action for this service : (lowercase) (optional).
//    : a list of required parameters for this service ('param1', 'param2', 'param3')


////
//// Labels
////
//// Performs the actions for labels.
////
////    /'+this.module.name()+'/labels/sync 
////
////


var log = AD.Util.Log;
var logDump = AD.Util.LogDump;
var async = require(__appdevPathNode + 'async');
var $ = AD.jQuery;

var siteLabels = new AD.App.Service({});
module.exports = siteLabels;


var siteHub = null;   // Module's Notification Center (note: be sure not to use this until setup() is called)
var siteDispatch = null;  // Module's Dispatch Center (for sending messages among Clients)


var createdLabelCache = {};  // use this to prevent recursive checks and reduce work.


//// NOTE: using Async.waterfall fn()s:

//-----------------------------------------------------------------------------
var getOriginalLabel = function(data, next) {
    // pull a copy of the Label from the Model
    // data has an ID:new ID

    var found = AD.Model.List['site.Labels'].findOne({id:data.id});
    $.when(found)
        .then(function(label){
        
            var key = cacheKey(label);
            
            if ('undefined' == typeof createdLabelCache[key]) {
                
                data.cacheKey = key;
                data.label = label;
                
                //// cache this label so we don't continue doing this
                createdLabelCache[key] = true;
                
                next(null, data);
                
            } else {
                
                // stop with an error: syncInProcess
                next({syncInProcess:true, cacheKey:key});
            }
        })
        .fail(function(err){
            
            // Stop with an error from our findOne()
            next(err);
        });
}



//-----------------------------------------------------------------------------
var getAllLanguages = function(data, next) {
    // add the List of All Languages to our data obj
    
    data.listLanguages = AD.Lang.listLanguages;
    next(null, data);

}



//-----------------------------------------------------------------------------
var getSimilarLabels = function(data, next) {
    // are there any other labels that have same label_path + label_key?
    
    var label = data.label;
    
    var found = AD.Model.List['site.Labels'].findAll({label_path:label.label_path, label_key:label.label_key});
    $.when(found)
        .then(function(labels){

            var similar = {};
            
            // for each returned similar label
            for(var i=0; i<labels.length; i++) {
                var lang = labels[i].language_code;
                
                // if it isn't the language of what was just created add it
                if (lang != label.language_code) {
                    similar[lang] = labels[i];
                }
                
            }
            
            data.similar = similar;
            next(null, data);
        })
        .fail(function(err){
            next(err);
        });

}



//-----------------------------------------------------------------------------
var syncAllLabels = function(data, next) {
  // foreach language, create a copy of the label that doesn't already exist
  
    var label = data.label;
    var listLanguages = data.listLanguages;
    
    for (var i=0; i< listLanguages.length; i++) {
        
        var currLang = listLanguages[i].language_code;
        if (label.language_code != currLang) {
            
            // if there DOESN'T exists a similar label in this lang
            if ('undefined' == typeof data.similar[currLang]) {
                
                // let's add this one:
                var newLabel = {};
                newLabel.language_code = currLang;
                newLabel.label_path = label.label_path;
                newLabel.label_label = '['+currLang+']:'+label.label_label;
                newLabel.label_key = label.label_key;
                newLabel.label_needs_translation = 1;
                
//console.log('creating new label:');
//console.log(newLabel);
                
                AD.Model.List['site.Labels'].create(newLabel);
            }
        }
        
    }
  
  next(null, data);
  
}



//-----------------------------------------------------------------------------
var cacheKey = function(label) {
    //  create a unique key from the values of this label
    
    
    return label.label_key+':'+label.label_path;
}



var labelsStack = [
   getOriginalLabel,       // make sure all required params are given
   getAllLanguages,        // find all the languages defined for the site
   getSimilarLabels,       // find any other labels that match this label
   syncAllLabels           // foreach language, make sure there is a label created
];



//-----------------------------------------------------------------------------
siteLabels.setup = function( app ) {
	// @param  app :  a link to the given module/interface's app object. 
	//                can be used to setup routes.
	
    // setup any handlers, subscriptions, etc... that need to have passed in 
    // private resources from the Module:
    //  this.hub = the module's Notification Hub
    //  this.listModels = the list of Model objects in the current Module
    // 
    
    siteHub = this.module.hub;
    siteDispatch = this.module.dispatch;
    
    
    var syncHandler = function(event, data) {

//console.log('syncHandler! event received['+event+']' );
//console.log(data);
        
            
        // add a fn() to push our data in to the stack
        var thisStack = [function(next){
            next(null, data);
        }];
        thisStack = thisStack.concat(labelsStack);
        
        
        async.waterfall(thisStack, function(err, results){
            
            // if err was provided
            if (err) {
                
                // if this was a sync warning
                if (err.syncInProcess) {
                    console.log('  - sync('+err.cacheKey+') finished (id:'+data.id+')');
                }
                
            } else {
                
                console.log('  - site.Labels.created: sync('+results.cacheKey+') finished');
            }

        });
    }
    siteHub.subscribe('site.Labels.created', syncHandler);

} // end initMessaging()



