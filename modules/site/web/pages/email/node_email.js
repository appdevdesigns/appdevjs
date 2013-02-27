//// Template Replace:
//   site     : the name of this interface's module: (lowercase)
//   email  : the name of this interface :  (lowercase)
//   Email  : the name of this interface :  (Uppercase)


////
//// Email
////
//// This is the Interface level definition for the Email page.
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



var emailInterface = new AD.App.Interface({
    pathPage: __dirname,
/*
    pathModules: __dirname + '/containers',
    pathScripts: __dirname+'/scripts',
    pathServices: __dirname+'/services',
*/
    listWidgets: [ 
                  'appdev_testwidget',
// AppRAD: WIDGET DEPENDENCY //    
                 ]
    });
    
module.exports = emailInterface;    
