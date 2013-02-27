/*
 * @class appdev_list_languagepicker
 * @parent AD_Client.Controller.Widgets
 * 
 * ##language picker
 * 
 * A widget that allows you to display the available languages in the system and select one
 * to update the display of the page.
 *
 */

// this widget depends on fg.menu.js to be loaded.  So do that
// here:
steal('/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {




    AD.Controller.extend("AppdevListLanguagepicker", 
        {
            // We will be given an id to a <div id=""></div>
    	
    		// we need to fill the contents with data in the format:
    	//<a tabindex="0" href="#[id]_Contents" class="fg-button fg-button-icon-right" id="[id]_Link" style="font-size:x-small; float:right;">English</a>
        //<div class="hidden" id="[id]_Contents">
        //    <ul>
         //      <li ><a href="#" code="en" >English</a></li>
		 //      <li ><a href="#" code="zh-hans" >中文</a></li>	
		 //      <li ><a href="#" code="ko" >Korean</a></li>
        //    </ul>
        //</div>
    	
    		// then we attach an appdev_menu_ipod() to the [id]_Link element.

            
            init: function (el, opt) {
            
            	// setup our default options
            	var defaults = {
            		minWidth:200,			// appdev_menu_ipod.minWidth parameter
        			fontSize:'x-small',		// size of the language entries
    				onChange:null,			// a callback() when a new language is selected
    				onSelect:null,          // a callback() when a new language is selected
    				initialValue:null       // what value to display initially
    			};
    			var options = $.extend(defaults, opt);

if (options.onChange!= null) {
    console.warn('appdev_list_languagepicker.onChange() is depreciated! Use onSelect() instead.')
    options.onSelect = options.onChange;
}
            	//// fill out internal data structure
            	
            	// create outer structure
            	this.$el = $(el);
            	this.options = options;
            	var _self = this;
            	
            	// save our id for later use
            	this.id = this.$el.attr('id');
            	
            	// make sure widget is hidden at the moment:
            	this.$el.hide();
            	
            	var fontSize = options.fontSize;
            	
            	var initialValue = options.initialValue || '';
            	
            	// create the Link (with no Language set yet)
            	this.$el.append(  $('<a tabindex="0" href="#'+this.id+'_Contents" class="fg-button fg-button-icon-right" id="'+this.idLink()+'" style="font-size:'+fontSize+';">'+initialValue+'</a>') );
            	
            	// now add the inner UL
            	var $div = $('<div id="'+this.id+'_Contents" class="hidden"></div>');
            	var $ul = $('<ul></ul>');
            	$div.append($ul);
            	this.$el.append($div);
            	
            	// get list of languages
            	this.listLang = {};
            	var lookupReady = AD.Lang.getList();
            	$.when(lookupReady).then(function(list){
  
            		// when the language list is loaded, then add an entry in the list for each 
            		for (var i=0; i<list.length; i++){
            			_self.listLang[list[i].language_code] = list[i].language_label;
            			$ul.append( $('<li ><a href="#" code="'+list[i].language_code+'" >'+list[i].language_label+'</a></li>') );
            		}
            		
            		var currLang = AD.Lang.Labels.getCurrLangKey();
            		if (initialValue != '') currLang = initialValue;
            		
            		$('#'+_self.id+'_Link').html(_self.listLang[currLang]);
            		
            		//// Now we are ready to attach our ipodmenu widget to the current list.
            		_self.attachIPodMenu();
            		
            		//// Make sure widget is displayed now.
            		_self.$el.show();
            	});
            	
 /*           	
            	var check = function (level, listDFDs) {
            		
            		if (level >= 100) {
            			return listDFDs;
            		} else {
            			
            			if (level === undefined) level = 1;
            			
            			if ( listDFDs === undefined) { listDFDs = []; }
            			
            			var dfd = $.Deferred();
            			listDFDs.push(dfd);
            			
            			console.log('checking level['+level+']');
            			var lookupReady = AD.Lang.getList();
            			$.when(lookupReady).then(function(list){
            				console.log('level['+level+'] completed.');
            				dfd.resolve();
            			});
            			
            			return check( level +1, listDFDs);
            		}
            	}
            	
            	var listWhenReady = check();
            	$.when(listWhenReady).then(function(){
            		console.log('**** OK all done now.  Check to see how many requests were sent.');
            	});
  */          	
            	
         
                /*
            	$('#'+this.id+'_Link').appdev_menu_ipod({
            	    //            contentDiv:'#langListContents',
            	            minWidth:200,
            	            onChange:function(element) {
            	                
            	                var langData = { language_code: element.attr('code') };
            	                
            	                OpenAjax.hub.publish("site.multilingual.lang.set", langData);
            	            }
            	});
            	*/
            
            
            }, 
            
            
            
            //-----------------------------------------------
            attachIPodMenu: function (  ) {
                // process the click event on each of the 
                // labels we are active on.
            
            	var listPicker = this;
	            
	            
            	$('#'+this.idLink()).appdev_menu_ipod({
            	    //            contentDiv:'#langListContents',
            	            minWidth:this.options.minWidth,
            	            onChange:function(element) {
            	                
            	                var langData = { language_code: element.attr('code') };
            	                
            	                // if a onSelect option is not provided
            	                if (listPicker.options.onSelect == null) {
            	                	
            	                	// default to announcing a language switch
            	                	AD.Comm.Notification.publish("site.multilingual.lang.set", langData);
            	                
            	                } else {
            	                	
            	                	// call onSelect() with our langData
            	                	listPicker.options.onSelect(langData);
            	                }
            	                return false;
            	            }
            	        });
                
            },
            
            
            
            //-----------------------------------------------
            idLink: function () {
                
            	return this.id+'_Link';
            }
        });
    
    
});
//// TODO:  Change Filename to appdev_menu_ipod.js
////        develop dependency system to dynamically load .js and .css
////        
