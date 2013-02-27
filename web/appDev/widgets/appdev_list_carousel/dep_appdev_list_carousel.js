

//// AppDev List Searchable
////
//// This is the dependency information for the appdev_list_searchable widget.
//// Our serverside node scripts will load this to know what other 
//// resources are required to use this widget.

//// Any Interface/container using this widget will report these resources
//// on the loading of the page.


// paths here should be from the 'data' directory. (appDevRoot/data/)
// our default dir is '/siteRoot/data/theme/default/'

//The skin file has been customized for our purposes.
//In the future, people could add skins by creating a new class jcarousel-skin-<name>
// and updating the ejs class to pull in that skin
// Alternitively, the skin could be specified when the widget instance is created.
// That way, different widgets could have different skins, even within the same page.
// However, this would create a bit of a disconnect, since they would have to tinker
// with the site-wide skin file in order to add a new skin.
exports.listCSS = ['/scripts/jcarousel/css/skin.css'];


//listJS paths should be in the following formats:  
//appDev/web/scripts/[*]                 : '//[*]'   // NOTE:  '[*]' will also work 
//appDev/widgets/*/*.js                  : '/appDev/widgets/[*]/[*].js'
//modules/[moduleName]/models/*          : '/[moduleName]/models/[modelName].js'
//modules/[moduleName]/web/resources/[*] : '/[moduleName]/[*]/fileName.js'
exports.listJS = [ '/appDev/widgets/appdev_list_carousel/appdev_list_carousel.js',
                   '/scripts/jcarousel/jquery.jcarousel.min.js'];

exports.listLabels = [ '/site/widgets/appdev_list_carousel' ];