////
//// PermissionsTasks
////
//// This model is the interface to the site_perm_tasks_data table.


(function () {
    // Pull AppDev from the global scope on NodeJS and browser and load the AppDev CommonJS module on Titanium
    var AD = (typeof AppDev === "undefined" ? (typeof global === "undefined" ? require('AppDev') : global.AD) : AppDev);
    
    // On Titanium and NodeJS, the full model definition is needed
    var extendedDefinition = typeof Titanium !== 'undefined' || typeof process !== 'undefined';
    
    var attr = {
        // Shared model attributes
        _adModule:'site',
        _adModel:'PermissionsTasks',
        id:'task_id',
        labelKey:'task_key',
        _isMultilingual:true,
        //connectionType:'server', // optional field
        cache:false
    };
    
    if (extendedDefinition) {
        // Extended model attributes
        AD.jQuery.extend(attr, {
            type:'multilingual',  // 'single' | 'multilingual'
            tables:{
                data:'site_perm_tasks_data',
                trans:'site_perm_tasks_trans'
            },
            fields: {
                data: {
                  task_id:"int(11)",
                  task_key:"varchar(25)"

                },
                trans: {
                  trans_id:"int(11)",
                  task_id:"int(11)",
                  language_code:"varchar(25)",
                  task_label:"text"

                  
                }
            },
            filters: {
                role_id: {
                    tableName: "site_perm_role_tasks",
                    foreignKey: "task_id"
                },
                viewer_guid: {
                    tableName: "site_perm_viewer_roles",
                    foreignKey: "role_id"
                }
            },
            primaryKey:'task_id',
            multilingualFields: ['task_label'],
            permittedRoles:['admin']
        });
    }
    
    
    var Model = AD.Model.extend("site.PermissionsTasks",
    attr,
    {
        // define instance methods here.
    });
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        // This is a CommonJS module, so return the model
        module.exports = Model;
    }
})();