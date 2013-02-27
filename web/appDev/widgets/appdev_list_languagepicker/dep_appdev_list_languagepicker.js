

//// AppDev List LanguagePicker
////
//// This is the dependency information for the appdev_list_languagepicker widget.
//// Our serverside node scripts will load this to know what other 
//// resources are required to use this widget.

//// Any Interface/container using this widget will report these resources
//// on the loading of the page.


// paths here should be from the [siteRoot]/data directory.
// our default dir is '/theme/default/'
exports.listCSS = [];


//listJS paths should be in the following formats:  
//appDev/web/scripts/[*]                 : '//[*]'   // NOTE:  '[*]' will also work 
//appDev/widgets/*/*.js                  : '/appDev/widgets/[*]/[*].js'
//modules/[moduleName]/models/*          : '/[moduleName]/models/[modelName].js'
//modules/[moduleName]/web/resources/[*] : '/[moduleName]/[*]/fileName.js'
exports.listJS = [ '/site/models/Language.js',
                   '/appDev/widgets/appdev_list_languagepicker/appdev_list_languagepicker.js'
                 ];

//label path for labels required for this widget:
exports.listLabelPaths = [''];


// TODO: replace these paths.  Instead use a uid for the reference.  have the system scan in files and 
//       know their paths.  Track them in a lookup obj:  {  'uid':'path' }.  Maybe UID = filename.
//
//		 maybe UID = [module].[type].[filename]
//					 'site.model.language.js'
//					 'appdev.widget.fgmenu.js'  // 'widgets.???'


// list the widgets that this widget depends on.  
//   just use the widget key that is used in the interface reference:  'appdev_list_languagepicker'
exports.listWidgets = ['appdev_menu_ipod'];

// TODO: embed links to other widgets and be able to parse those dependencies in the respective locations.
//       getLabels(), getCSS(), getJavascripts()