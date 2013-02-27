var db = AD.Model.Datastore.DB;

exports.hasPermissions = function(req)
{
    return true;
}


exports.listJavascripts = [
    //'/adminToolbar/Accounts/scripts/jquery.csv-0.61.min.js',
    '/adminToolbar/Accounts/widgets/iphone-style-checkboxes.js',
    '/site/models/Settings.js', // model for `site_settings`
    '/site/models/Viewer.js', // model for `site_viewer`
    '/appDev/widgets/appdev_select_add/appdev_select_add.js',
    '/adminToolbar/Accounts/scripts/accounts.js'
];

exports.listCSS = [
    '/adminToolbar/Accounts/css/accounts.css',
    '/adminToolbar/Accounts/widgets/iphone-style-checkboxes.css'
];



exports.toolDefinition = function(req, callback)
{
    var definition = {
        name: 'Accounts',
        image: '/adminToolbar/Accounts/images/account.png'
    }
    var languages = {};
    var roles = {};
    var dataLists = {
        'language': languages,
        'role': roles,
        'status': {
            '0': 'Inactive',
            '1': 'Active'
        }
    };
    
    
    // Render the QuickMenu and WorkArea using templates
    async.auto({
        "get_langs": function(next) {
        	
        	/*
            // do we have a model for `site_multilingual_language` yet?
            db.query(
                "SELECT * FROM "+AD.Defaults.dbName+".`site_multilingual_language`", [],
                function(err, results, fields) {
                    if (err) {
                        log(err);
                        return next();
                    }
                    for (var i=0; i<results.length; i++) {
                        var langKey = results[i]['language_code'];
                        var langLabel = results[i]['language_label'];
                        languages[langKey] = langLabel;
                    }
                    next();
                }
            );
            */
        	// This should already be in req.aRAD.response.listLanguages
        	for(var i=0; i< req.aRAD.response.listLanguages.length; i++) {
        		var entry = req.aRAD.response.listLanguages[i];       		
        		languages[entry.language_code] = entry.language_label;
        	}
        	next();
        },
        "get_roles": function(next) {
            AD.Model.List['site.PermissionsRoles'].findAll(
                {}, 
                // Success
                function(data) {
                    for (var i=0; i<data.length; i++) {
                        var roleID = data[i]['role_id'];
                        var roleLabel = data[i]['role_label'];
                        roles[roleID] = roleLabel;
                    }
                    next();
                },
                // Error
                function(stuff) {
                    log(stuff);
                    next();
                }
            );
        },
        "render_quickmenu": ['get_langs', 'get_roles', function(next) {
            ejs.renderFile(
                __dirname+'/quickmenu.ejs',
                { locals: {
                    "roles": roles,
                    "languages": languages,
                    "labels": req.aRAD.response.labels
                } },
                function(err, html) {
                    if (err) console.error(err);
                    definition.quickMenuHTML = html;
                    next();
                }
            );
        }],
        "render_workarea": ['get_langs', 'get_roles', function(next) {
            ejs.renderFile(
                __dirname+'/workarea.ejs',
                { locals: {
                    "roles": roles,
                    "languages": languages,
                    "dataLists": JSON.stringify(dataLists),
                    "labels": req.aRAD.response.labels
                } },
                function(err, html) {
                    if (err) console.error(err);
                    definition.workAreaHTML = html;
                    next();
                }
            );
        }]
    }, 
    // Deliver the completed tool definition after rendering
    function() {
        callback(definition);
    });
}
