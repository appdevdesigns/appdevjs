////
//// Language
////
//// This model is the interface to the site_multilingual_language table.


(function () {
	// Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);

    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';

	var attr = {
	    // Client Definitions
	    _adModule:'site',
	    _adModel:'Language',
	    id:'language_id',
	    labelKey:'language_label',
	    _isMultilingual:false
	}

	if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
        	type:'single',  // 'single' | 'multilingual'
//            dbName:'local_db',
            dbTable:'site_multilingual_language',
            modelFields: {
		              language_id:"int(11) unsigned",
		              language_code:"varchar(10)",
		              language_label:"text"
            },
            primaryKey:'language_id'
        });
	}


    var Model = AD.Model.extend("site.Language",
	attr,
	{
	    // define instance methods here.
	});


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }

})()