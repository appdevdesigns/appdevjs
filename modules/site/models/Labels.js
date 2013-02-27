////
//// Labels
////
//// This model is the interface to the site_multilingual_label table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'Labels',
        id:'label_id',
        labelKey:'label_key',
        _isMultilingual:false,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'single',  // 'single' | 'multilingual'
            dbTable:'site_multilingual_label',
            modelFields: {
                  label_id:"int(11) unsigned",
                  language_code:"varchar(10)",
                  label_key:"text",
                  label_label:"text",
                  label_lastMod:"datetime",
                  label_needs_translation:"tinyint(1) unsigned",
                  label_path:"text"

            },
            primaryKey:'label_id'
        });
    }
    
    
    var Model = AD.Model.extend("site.Labels",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();