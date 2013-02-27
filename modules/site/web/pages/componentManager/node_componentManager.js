//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   componentManager  : the name of this interface :  (lowercase)
//   ComponentManager  : the name of this interface :  (Uppercase)


 /**
 * @class Site.client.pages.componentManager
 * @parent Site.client.pages
 * 
 * ##Component Manager interface.
 * 
 * This is the admin Component Manager interface.
 */


////
//// ComponentManager
////
//// This is the Interface level definition for the ComponentManager page.
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


var installer = require(__appdevPath + '/server/installerTools.js');


var componentManagerInterface = new AD.App.Interface({
    pathPage: __dirname,
    pageStack: [function(req, res, next) {
        installer.findSystems(function(allsystems, modules, themes, widgets) {
            // Set all widgets to "installed" and read-only.
            // Widgets cannot be enabled or disabled. They are listed here
            // only for informational purposes.
            for (var i=0; i<widgets.length; i++) {
                widgets[i]['readonly'] = 1;
                widgets[i]['installed'] = 1;
            }
            
            // Make the "site" module read-only.
            for (var i=0; i<modules.length; i++) {
                if (modules[i]['name'] == 'site') {
                    modules[i]['readonly'] = 1;
                    break;
                }
            }
            
            req.aRAD.response.templateData.systems = {
                'modules': modules,
                'themes': themes,
                'widgets': widgets
            };
            
            next();
        });
    }],
/*
    pathModules: __dirname + '/containers',
    pathScripts: __dirname+'/scripts',
    pathServices: __dirname+'/services',
*/
    listWidgets: [ 
// AppRAD: WIDGET DEPENDENCY //    
                 ]
    });
module.exports = componentManagerInterface;   
