/**
 * This file defines the theme information for our default theme.
 * 
 */

// All paths are expected to come from the root/web/theme/[themeName] directory:

var config = {
        version:1, // v1.0 of our Theme definition
        'default':{
            listCSS:[
                 'css/site.css',
                 'css/style.css',
                 'css/system.theme.css',
                 'css/system.base.css'
            ], 
            listJavascripts:[],
            pathTemplate:'views/siteContent.ejs'
        },
        'empty':{
            listCSS:['css/site.css'],
            listJavascripts:[],
            pathTemplate:'views/empty.ejs'
        }
}



module.exports = config;

