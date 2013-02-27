////
//// PermissionsRoles
////
//// This model is the interface to the site_perm_roles table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'PermissionsRoles',
        id:'role_id',
        labelKey:'role_label',
        _isMultilingual:false,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'single',  // 'single' | 'multilingual'
            dbTable:'site_perm_roles',
            modelFields: {
                  role_id:"int(11)",
                  role_label:"text"

            },
            filters: {
                viewer_guid: {
                    tableName: "site_perm_viewer_roles",
                    foreignKey: "role_id"
                }
            },
            primaryKey:'role_id',
            permittedRoles:['admin']
        });
    }
    
    
    var Model = AD.Model.extend("site.PermissionsRoles",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();