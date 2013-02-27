/*
 * @class appdev_menu_ipod
 * @parent AD_Client.Controller.Widgets
 * 
 * ##ipod menu
 * 
 * A widget to create an ipod like menu system
 *
 */

// this widget depends on fg.menu.js to be loaded.  So do that
// here:
steal('/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {




    AD.Controller.extend("AppdevMenuIpod", 
        {
            // This object will transform the data in a menu 
            
            
            
            init: function (el, options) {
            
                
                // this widget needs to get it's data from:
                    // 1) a passed in DataStore
                    // 2) a passed in contentDiv attrib
                    // 3) an embedded href="#divID"
                    
            
                // option.updateMenuWithSelectedOption:T/F : [F]
                
                // 
            
            
                this.onChange = options.onChange || null;
                
                
                var $el = $(el);
                
                options = options || {};
                
                this.$displayValue = $el;
                
                this.prevValue = this.$displayValue.text();
                
                // 
                var me = this;
                options.onClick = function( e, menuItem) {
                    me.clickedMenu(menuItem, e);
                    return false;
                }
                

                // try to find any specified z-index of our parent objects
                var myZ = 'auto';	// what we want our z-index to be
                var currObj = $el;	// current obj to check
                var checkZ = function() {
                	
                	// if we have a different setting then 
                	var objZ = currObj.css('z-index');
                	if (objZ != myZ) {
                		
                		// grab the new z-index and end
                		myZ = currObj.css('z-index');
                		
                	} else {
                		
                		// look at parent object
                		currObj = currObj.parent();
                		
                		// only call checkZ() again if currObj has a parentElement
                		if (currObj[0].parentElement != null) checkZ();
                	}
                }
                checkZ();
                
                
                // use the embedded href for this el to determine the 
                // contents of our menu:
                var hrefValue = $el.attr('href');
                
                
                var menuContent = $(hrefValue).html();
                // call the menu() plugin on our element
                $el.fgmenu({ 
                    content: menuContent, // grab content from this page
                    showSpeed: 400,
                    'z-index':myZ,
                    onChosen: function (item) {
                    
                        me.clickedMenu(item);
                        return false;
                    },
                    followLink:false
                });
                
                //ui-widget ui-widget-content ui-corner-all
                
                // find 
            }, 
            
            
            
            //-----------------------------------------------
            clickedMenu: function ( item ) {
                // process the click event on each of the 
                // labels we are active on.
            
                var $item = $(item);
                var newLabel = $item.text();
                this.element.text(newLabel);
                
                
                var value = newLabel;
                            
                if (this.prevValue != value) {
                
                    // spark an onChange event
                    if (this.onChange != null) {
                    
                        this.onChange( $item );
                    }
                    this.prevValue = value;
                }
                
            },
            
            
            
            //-----------------------------------------------
            destroy: function (topic, data) {
                // cleanly remove our changes to the DOM
            

                // be sure to call this!
                this._super();
                
            }
        });
    
    
});
////TODO: make Multilingual
////crumbDefaultText: 'Choose an option:',
////backLinkText: 'Back',
////       
