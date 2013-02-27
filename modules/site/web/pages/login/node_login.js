////
//// Login
////
//// This is the Interface level definition for the Login page.
////
//// An "interface" is usually a new page displayed in the browser, 
//// requiring a full page load.  
////
//// An interface is required to load:
////    listJavascripts :  all the javascript files required for this page
////    listCSS : any css files required for this page
////    pathTemplate: the path from the site root to the template file to 
////                  use to render the page content
////    templateData: an object representing all the data to use to render 
////                  the template for this page content



var loginInterface = new AD.App.Interface({
    pathPage: __dirname,
    themePageStyle: 'empty',
    pageStack: [AD.Lang.loadLanguages, function(req, res, next) {
        req.aRAD.response.templateData.listLanguages = req.aRAD.response.listLanguages;
        next();
    }],
/*
    pathModules: __dirname + '/containers',
    pathScripts: __dirname+'/scripts/',
    pathServices: __dirname+'/services/',
*/
    listWidgets: [ 
                    'appdev_menu_ipod',
                    'appdev_list_xlationstate' 
// AppRAD: WIDGET DEPENDENCY //    
                 ]
    });
module.exports = loginInterface;

////
//// View Routes
////

var app = loginInterface.app;

//// Now insert the authenticate url and it's action:
app.all('/service/site/login/authenticate', AD.Auth.login );
