/*
 * @class appdev_list_carousel
 * @parent AD_Client.Controller.Widgets
 * 
 * ###List module
 * 
 * A List module widget
 *
 * options.onElement: a callback function used to generate the content of each carousel entry. onElement(rowMgr, pos#)
 * 
 * ex using onElement:
 * @codestart
 *    appdev_list_carousel({
 *    		dataManager:listModules,
 *          onElement:function(rowMgr){
 *       		return '<img src="'+(rowMgr.iconPath || '/theme/default/images/icon.jpg')+'" width="75" height="75" alt="">'+
 *				'<div class="module-name"><h5>'+rowMgr.getLabel()+ '</h5></div>';
 *       	},
 *    });
 * @codeend
 * 
 * options.template : an ejs template (using '[' tags) where 'this' refers to the individual Model obj. 
 * 					  a Template is used to generate the content of each carousel entry. Providing a template overrides onElement.
 * 					  in a provided template
 *
 * ex using template:
 * @codestart
 *    appdev_list_carousel({
 *    		dataManager:listModules,
 *          template:'<img src="[%== (this.iconPath || "/theme/default/images/icon.jpg") %]" width="75" height="75" alt="">'+
 *   				 '<div class="module-name"><h5>[%= this.getLabel() %]</h5></div>'
 *    });
 * @codeend
 */
 
//this widget depends on fg.menu.js to be loaded.  So do that here:
//steal('/scripts/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {
steal('/appDev/widgets/appdev_list_carousel/appdev_list_carousel.ejs');  // use use an EJS template, so use steal to cache it 

    AD.Controller.extend("AppdevListCarousel", 
        {
            //-----------------------------------------------------------------
            init: function (el, options) {

                var defaults = {
                      gid:'appdev_list_carousel',
                      dataManager: null,	// the listIterator of the data to display
                      onSelection: null,	// provided selection callback
                      onElement:null,		// provided callback that generates the content that is inserted
                      template:null			// a provided $.EJS template to use to display the data
                };
                var options = $.extend(defaults, options);  
                
                this.dataManager = options.dataManager;
                
                this.onSelection = options.onSelection;
                this.onElement   = options.onElement;
                this._template = null;
                if (options.template != null) {
                	this._template = $.EJS({text:options.template, type:'['});
                }
                
                // insert our DOM elements
                this.insertDOM();
                
                this.initList();
                
            },
            
            
            
            initList: function(){
            	
                this.carouselDiv = this.element.find('.jcarousel-widget');
                this.carouselDiv.jcarousel();
            	
            	if (this.dataManager != null){
            		
            		var self = this;
            		var loaded = this.dataManager.loaded();
            		$.when(loaded).done(function(data) {
            			self.loadFromDataManager();
            			self.dataManager.bind('change', self.loadFromDataManager, self);
            		})
                    .fail(function(data) {
                        // do the bind just in case the first load failed
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                    });
            		
            		
            	}
            	
            },
            
            
            
            insertDOM: function() {
                
                this.element.html(this.view('/appDev/widgets/appdev_list_carousel/appdev_list_carousel.ejs', {}));
                
            },
            
            
            
            loadFromDataManager: function() {
            	
            	// Question: do we need to delete any existing <li> before doing this?
            	
            	var carousel = this.carouselDiv.data('jcarousel');
        		carousel.size(this.dataManager.listData.length);
        		
            	var cnt = 1;
            	var self = this;
        		this.dataManager.each(function(row){
        			var html = ' template/onElement not specified! ';
        			
        			if (self._template != null) {
        				
        				html = self._template(row);
        				
        			} else if (self.onElement != null) {
        				
        				html = self.onElement(row, cnt);
        			}
            		
            		var $html = $(html);
            		self.carouselDiv.jcarousel('add',cnt++,$html);
            		
            		var $myLI = $html.parent();
            		$myLI.data('adModel', row); // store the model instance with the parent LI.
            		
            		
        		});
                self.carouselDiv.jcarousel('reload');

        		var listOfLi = this.element.find('li');
            	listOfLi.bind('click',this.onSelection);
            },  
            
        });
