/*
 * @class appdev_list_xlationstate
 * @parent AD_Client.Controller.Widgets
 * 
 * ##Xlation State
 * 
 * This widget allows you to change the translation state of the current page.
 *
 */

// this widget depends on fg.menu.js to be loaded.  So do that
// here:
steal('/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {




    AD.Controller.extend("AppdevListXlationstate", 
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
            
            
            
            init: function (el, options) {
            
                
            	//// fill out internal data structure
            	
            	// create outer structure
            	this.$el = $(el);
            	var _self = this;
            	
            	// save our id for later use
            	this.id = this.$el.attr('id');
            	
            	// make sure widget is hidden at the moment:
            	this.$el.hide();
            	
            	var fontSize = options.fontSize || 'x-small';
            	
            	// create the Link (with no Language set yet)
            	this.$el.append(  $('<a tabindex="0" href="#'+this.id+'_Contents" class="fg-button fg-button-icon-right" id="'+this.idLink()+'" style="font-size:'+fontSize+';"></a>') );
            	
            	// now add the inner UL
            	var $div = $('<div id="'+this.id+'_Contents" class="hidden"></div>');
            	var $ul = $('<ul></ul>');
            	$div.append($ul);
            	this.$el.append($div);
            	
            	
            	// fill out the Translation Options
            	var L = AD.Lang.Labels.getLabel;
            	
            	// NOTE: don't allow these labels to be translated via the PUX tool (can't turn it off if you do!)
            	var textNone = L('[list.xlationstate.none]');
            	var textMissing = L('[list.xlationstate.missing]');
            	var textAll = L('[list.xlationstate.all]');
            	
            	$ul.append( $('<li ><a href="#" value="'+AD.Lang.Xlation.Mode.NONE+'" >'+textNone.label+'</a></li>') );
            	$ul.append( $('<li ><a href="#" value="'+AD.Lang.Xlation.Mode.MISSING+'" >'+textMissing.label+'</a></li>') );
            	$ul.append( $('<li ><a href="#" value="'+AD.Lang.Xlation.Mode.ALL+'" >'+textAll.label+'</a></li>') );
            	

            		
        		var currLang = AD.Lang.Labels.getCurrLangKey();
        		$('#'+this.id+'_Link').html(AD.Lang.Xlation.currentMode);
        		
        		//// Now we are ready to attach our ipodmenu widget to the current list.
        		this.attachIPodMenu();
        		
        		//// Make sure widget is displayed now.
        		this.$el.show();
      
            
            
            }, 
            
            
            
            //-----------------------------------------------
            attachIPodMenu: function (  ) {
                // process the click event on each of the 
                // labels we are active on.
            
            	$('#'+this.idLink()).appdev_menu_ipod({
 
            	            minWidth:200,
            	            onChange:function(element) {
            	                
            	                var xlationData = { mode: element.attr('value') };
            	                
            	                AD.Comm.Notification.publish("site.multilingual.xlation.set", xlationData);
            	            }
            	        });
                
            },
            
            
            
            //-----------------------------------------------
            idLink: function () {
                
            	return this.id+'_Link';
            }
        });
    
    
});
       
