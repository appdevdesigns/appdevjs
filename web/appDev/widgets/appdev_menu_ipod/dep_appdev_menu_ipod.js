

//// AppDev Menu iPod
////
//// This is the dependency information for the appdev_menu_ipod widget.
//// Our serverside node scripts will load this to know what other 
//// resources are required to use this widget.

//// Any Interface/container using this widget will report these resources
//// on the loading of the page.


// paths here should be from the [siteRoot]/data directory.
// our default dir is '/theme/default/'
exports.listCSS = [ '/theme/default/css/fg.menu.css' ];


//listJS paths should be in the following formats:  
//appDev/web/scripts/[*]                 : '//[*]'   // NOTE:  '[*]' will also work 
//appDev/widgets/*/*.js                  : '/appDev/widgets/[*]/[*].js'
//modules/[moduleName]/models/*          : '/[moduleName]/models/[modelName].js'
//modules/[moduleName]/web/resources/[*] : '/[moduleName]/[*]/fileName.js'
exports.listJS = [ '/appDev/widgets/appdev_menu_ipod/appdev_menu_ipod.js' ];


// label path for labels required for this widget:
exports.listLabelPaths = ['/widgets/menu/ipod'];