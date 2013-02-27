/*
 * @class appdev_list_module
 * @parent AD_Client.Controller.Widgets
 * 
 * ###List module
 * 
 * A List module widget
 *
 */
 
//this widget depends on fg.menu.js to be loaded.  So do that here:
//steal('/scripts/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {
steal('/appDev/widgets/appdev_list_module/appdev_list_module.ejs');

    AD.Controller.extend("AppdevListModule", 
        {
            //-----------------------------------------------------------------
            init: function (el, options) {
            
                
                var defaults = {
                      gid:'appdev_list_module'
                };
                var options = $.extend(defaults, options);    
                
                // insert our DOM elements
                this.insertDOM();
                
                this.initList();
            },
            initList: function(){
            	var listModules = appRAD.Modules.listManager({});
            	var modules = listModules.listData;
            	var carouselDiv = this.element.find('.jcarousel-skin-tango');
            	carouselDiv.jcarousel({
            		size: listModules.listData.length
            		width: 200
            	});
            	for(var i=0;i<listModules.listData.length;i++){
            		html = '<img src="/theme/default/images/icon.jpg" width="75" height="75" alt="">'+
     		       '<div class="module-name"><h5>'+listModules.listData[i].name+'</h5></div>';
            		carouselDiv.jcarousel('add',i+1,html);
            	}
            },
            insertDOM: function() {
                
                this.element.html(this.view('/appDev/widgets/appdev_list_module/appdev_list_module.ejs', {}));
                
            }
        });
