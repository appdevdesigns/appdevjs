////
//// Viewer
////
//// This model is the interface to the site_viewer table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'Viewer',
        id:'viewer_id',
        labelKey:'viewer_userID',
        _isMultilingual:false,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'single',  // 'single' | 'multilingual'
            dbTable:'site_viewer',
            modelFields: {
                  viewer_id:"int(11) unsigned",
                  language_key:"varchar(12)",
                  viewer_passWord:"text",
                  viewer_userID:"text",
                  viewer_isActive:"int(1)",
                  viewer_lastLogin:"datetime",
                  viewer_globalUserID:"text"

            },
            primaryKey:'viewer_id',
            permittedRoles:['admin']
        });
    }
    
    
    var Model = AD.Model.extend("site.Viewer",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();