////
//// Switcheroo
////
//// This model is the interface to the site_viewer_switcheroo table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'Switcheroo',
        id:'switcheroo_id',
        labelKey:'switcheroo_realID',
        _isMultilingual:false,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'single',  // 'single' | 'multilingual'
            dbTable:'site_viewer_switcheroo',
            modelFields: {
                  switcheroo_id:"int(11) unsigned",
                  switcheroo_realID:"text",
                  switcheroo_fakeID:"text"

            },
            primaryKey:'switcheroo_id',
            permittedRoles:['admin']
        });
    }
    
    
    var Model = AD.Model.extend("site.Switcheroo",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();