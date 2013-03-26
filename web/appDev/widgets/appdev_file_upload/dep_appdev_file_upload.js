//// AppDev Load File
////
//// This is the dependency information for the appdev_dropdown widget.
//// Our serverside node scripts will load this to know what other 
//// resources are required to use this widget.

//// Any Interface/container using this widget will report these resources
//// on the loading of the page.


// paths here should be from the 'data' directory. (appDevRoot/data/)
// our default dir is '/siteRoot/data/theme/default/'
exports.listCSS = [ ];


//listJS paths should be in the following formats:  
//appDev/web/scripts/[*]                 : '//[*]'   // NOTE:  '[*]' will also work 
//appDev/widgets/*/*.js                  : '/appDev/widgets/[*]/[*].js'
//modules/[moduleName]/models/*          : '/[moduleName]/models/[modelName].js'
//modules/[moduleName]/web/resources/[*] : '/[moduleName]/[*]/fileName.js'
exports.listJS = [
    '/appDev/widgets/appdev_file_upload/appdev_file_upload.js',
    '//blueimp/jquery.iframe-transport.js',
    '//blueimp/jquery.fileupload.js'
];

exports.listLabels = [ '/site/widget/appdev_file_upload' ];