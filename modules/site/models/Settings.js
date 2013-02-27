////
//// Settings
////
//// This model is the interface to the site_settings table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'Settings',
        id:'settings_id',
        labelKey:'settings_key',
        _isMultilingual:false,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'single',  // 'single' | 'multilingual'
            dbTable:'site_settings',
            modelFields: {
                  settings_id:"int(11) unsigned",
                  settings_key:"text",
                  settings_value:"text"

            },
            primaryKey:'settings_id',
            permittedRoles:['admin']
        });
    }
    
    
    var Model = AD.Model.extend("site.Settings",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();