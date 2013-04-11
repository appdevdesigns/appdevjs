//// Template Replace:
//   site     : the name of this page's module: (lowercase)
//   unitTests  : the name of this page :  (lowercase)
//   UnitTests  : the name of this page :  (Uppercase)


////
//// UnitTests
////
//// This is the Page level definition for the UnitTests page.
////
//// An "page" is usually a new page displayed in the browser, 
//// requiring a full page load.  
////
//// An page is required to load:
////    listJavascripts :  all the javascript files required for this page
////    listCSS : any css files required for this page
////    pathTemplate: the path from the site root to the template file to 
////                  use to render the page content
////    templateData: an object representing all the data to use to render 
////                  the template for this page content



var unitTestsPage = new AD.App.Interface({
    pathPage: __dirname,
/*
    pathModules: __dirname + '/containers',
    pathScripts: __dirname+'/scripts',
*/
    listWidgets: [ 
// AppRAD: WIDGET DEPENDENCY // 
		'appdev_list_carousel'
                 ]
    });
module.exports = unitTestsPage;   

////
//// View Routes
////

var app = unitTestsPage.app;

/*
 * You can override the default setup routine by uncommenting this and 
 * making changes:
 * 
unitTestsPage.setup = function(callback) 
{
    var $ = AD.jQuery;
    var dfd = $.Deferred();

    //// 
    //// Scan any sub containers to gather their routes
    ////
    var dfdContainers = unitTestsPage.loadContainers();
    
    
    //// 
    //// Scan for any services and load them
    ////
    var dfdPages = unitTestsPage.loadServices();
    
    
    // Scan for any .css files registered for this page
    unitTestsPage.loadPageCSS();
    
    // Create our routes : page/css
    unitTestsPage.createRoutes();

    ////
    //// Resolve the deferred when done
    ////
    $.when(dfdContainers, dfdPages).then(function() {
        callback && callback();
        dfd.resolve();
    });
    
    return dfd;
}

*/



/*
 
 // if You need to do additional additions to the data being passed to your unitTests.ejs view
 // you can do that here:
 

var step1 = function(req, res, next) {
	
	var guid = req.aRAD.viewer.viewer_globalUserID;
    

	// data being passed to your template should be stored in req.aRAD.response.templateData
	req.aRAD.response.templateData['token'] = guid;
	
	// they can be accessed in your template as <%- data.token %>

	next();
}

unitTestsPage.pageStack = [step1];  // make sure this gets called after our page/unitViewer gets loaded:

 */
