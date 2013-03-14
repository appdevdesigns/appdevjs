    
    if (typeof AD.Lang == "undefined") {
        AD.Lang = {};
    }
    
   /*
    * 
    * @class AD.Lang.Xlation
    * @parent AD_Client.Lang
    *
    * This is a generic class for handling our translation requests. 
    * 
    * This object is responsible for :
    * 
    * * Providing a communication mechanism to update/display multilingual values on the page (think labels).
    * * Responding to Global Notifications related to switching the current multilingual language
    * * Responding to on screen widgets wanting to construct their display which includes a multilingual label
    *
    */
    
    
    
    //// -----------------------------------------------------------------
    $.Controller.extend("AppdevPuxLabel", 
    {
        // This Object creates a controller for each of the labels that act as 
        // a pop up xlation (pux) label.  These labels will be responsible for
        // alerting the PUXForm object that a label is being requested for editing.
        
        
        
        init: function (el, data) {
        
            var $el = $(el);
            
            $el.addClass('puxLabel');
            this.$button = null;
            
            var me = this;
            
            var thisElement = this.element;
            
            // if element is within a button 
            var $parents = $el.parents().each(function () { 
            
                // special case for labels contained in BUTTON elements:
                // replace their "click" event with our Click event:
                if (this.tagName == 'BUTTON') {
                
                    // get button's onClick function
                    me.$button = $(this);
                    me.buttonEvents = me.$button.data("events");
                    if (typeof me.buttonEvents != 'undefined') {
                    
                        me.buttonOnClick = me.buttonEvents.click[0];
                    
                        // remove onClick event
                        me.$button.unbind('click', me.buttonOnClick);
                        
                    }
                    
                    // add our click handler
                    me.$button.bind('click',function(el, event) { me.click(el, event); });
                    return false;
                    
                }
            
            });
            
        }, 
        
        
        
        //-----------------------------------------------
        click: function ( el, event ) {
            // process the click event on each of the 
            // labels we are active on.
        
        
            // make sure event is our event object
            // NOTE: when called from a BUTTON obj, el == event
            //       so we have to switch them here.
            if ((typeof event == 'undefined')
                && (typeof el.originalEvent != 'undefined')) {
                event = el;
            }

//            self = $(this);
            
            // build the obj data that we send to PUX Form
            // widget.
            var eventData = {
            
                pageY:event.pageY,
                pageX:event.pageX,
                key: this.element.attr('key'),
                langKey: this.element.attr('langkey')
                
            };
            
            OpenAjax.hub.publish("pux.label.load", eventData);
            
            event.preventDefault();
            event.stopPropagation();
        },
        
        
        
        //-----------------------------------------------
        destroy: function (topic, data) {
            // cleanly remove our changes to the DOM
        
            this.element.removeClass('puxLabel');
            
            // Undo our Button switcheroo if present:
            // if this has a stored buttonOnClick
            if (this.$button != null) {
            
                // return button's onClick handler
                this.$button.unbind('click');
                if (typeof this.buttonOnClick != 'undefined') {
                    this.$button.bind('click', this.buttonOnClick.handler);
                }
                
            } // end if
            
            
            // be sure to call this!
            this._super();
            
        }
    });
    
    
    
    
    //// -----------------------------------------------------------------
    $.Controller.extend("AppdevPuxForm", 
    {
        // This object is the pop up xlation (pux) Form controller.  It manages 
        // all the operations of the form (display, hide, submit, cancel).
    
        init: function (el, data) {
        
                       
        }, 
        
        
        
        //-----------------------------------------------
        'button.save click': function ( event ) {
            // process the save button action here.
            
            var gotClick = true;
            
            
            var labelInfo = {
                key :'unknown',
                label:'unknown'
            };
            

            labelInfo.key = this.element.find('.label-key').text();
            labelInfo.label = this.element.find('textarea').val();
            
            // update the given label info in the 
            // AD.Lang.Labels object
            var self = this;
            
            AD.Lang.Labels.updateLabel( labelInfo, function() { 
            
                // when this is called, the label should have 
                // been updated:
                
                // clear form
                self.element.find('.set-key, .label-key').empty();
                self.element.find('textarea').val('');
                self.element.find('.message').hide();
              
              
                self.element.fadeOut('fast');
               
            }, function () { /* display error message */ });
        },
        
        
        
        //-----------------------------------------------
        'button.cancel click': function ( event ) {
            // process the cancel button action here.
            
            // clear form
            this.element.find('.set-key, .label-key').empty();
            this.element.find('textarea').val('');
            this.element.find('.message').hide();

            // hide form
            this.element.fadeOut('fast');

        },
        
        
        
        //-----------------------------------------------
        "pux.label.load subscribe": function (topic, data) {
            // respond to 'pux.label.load' messages.
            //
            // When translation is enabled, any multilingual 
            // label should be able to generate this message 
            // when it is clicked.
            // 
            // this is how we get labels loaded into the form.

            this.loadForm(data);
            this.showForm(data);
            
        },
        
        
        
        //-----------------------------------------------
        loadForm: function( labelInfo ) {
            // initialize the translation form with the given
            // label info.
            //
            // labelInfo = {
            //      path:[path],
            //      key:[key],
            //      langKey:[language_code],
            // }
            
            
            // get the Label info from the AD.Lang.Label 
            // object
            var label = AD.Lang.Labels.getLabel( labelInfo );
            
            
            // display that info on the form:
            this.element.find('.label-key').text(label.key);
            this.element.find('textarea').val(label.label);
        
        },
        
        
        
        //-----------------------------------------------
        showForm: function( eventObj ) {
            // take the given eventObj info and show the 
            // pux form near where the user clicked on the 
            // screen.
        
            
            // Display the form on the page where the user clicked on
            var yModifier = 15;
            var xModifier = 0;
            var formWidth = this.element.outerWidth();
            var pageWidth = $(document).width();
            if (eventObj.pageX + formWidth > pageWidth) {
              // Don't let the label edit form overwiden the page
              xModifier = pageWidth - eventObj.pageX - formWidth;
            }
            this.element.css({
              'position': 'absolute',
              'top': eventObj.pageY + yModifier,
              'left': eventObj.pageX + xModifier,
              'z-index': 1200
            });
            this.element.slideDown();
        
        }
        
        
    });
    
    
    
    ////------------------------------------------------------------------
    AD.Lang.XlationBase = Base.extend({
        // This is our 
        
        
        
        Mode: {
            NONE:'none',
            MISSING:'missing',
            ALL:'all'
        },
        
        
        constructor : function ( settings ) {
            
            for(var s in settings) {
                this[s] = settings[s];
            }
            
            this.$puxForm = null;
            
            this.currentMode = 'none';
        
        },
        
        
        createForm: function () {
        
            if (this.$puxForm == null) {
            
                var html = '\
                  <div id="puxForm" style="display:none;" class="ui-corner-all ui-dialog ui-widget ui-widget-content">\
                    <div class="busy-icon"></div>\
                    <table width="100%">\
                      <tr>\
                        <th>Path</th>\
                        <td class="set-key"></td>\
                      </tr>\
                      <tr>\
                        <th>Key Name</th>\
                        <td class="label-key"></td>\
                      </tr>\
                      <tr>\
                        <th>Label</th>\
                        <td class="label-text">\
                          <textarea rows="5" cols="30"></textarea>\
                        </td>\
                      </tr>\
                    </table>\
                    <button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only save" role="button" type="button">Save</button>\
                    <button class="cancel">Cancel</button>\
                    <div class="message ui-corner-all ui-state-error" style="display:none"></div>\
                  </div>\
                ';
                
                this.$puxForm = $(html);
                this.$puxForm.appdev_pux_form();
                this.$puxForm.appendTo(document.body);
            
            }
        
        },
        
        
        
                    
        onXlationSwitch: function( topic, data) {
          
            var myData = data;
            
            this.currentMode = data.mode;
          
            switch (data.mode) {
            
                case AD.Lang.Xlation.Mode.ALL:
                case AD.Lang.Xlation.Mode.MISSING:
                
                    AD.Lang.Xlation.createForm();
                
                    //// TODO: pull out missing and only look for .appLabel 
                    ////       with param of puxType=missing
                
                    // for each of our multilingual labels (.appLabel)
                    // add our widget/controller
                    $('.appLabel').appdev_pux_label();
                    break;
                    
                    
                case AD.Lang.Xlation.Mode.NONE:
                
                    // for each .appLabel object remove the widget
                    $('.appLabel').appdev_pux_label("destroy");
                    break;
                    
                
            }
            
        }
    
    
    } );


AD.Lang.Xlation = new AD.Lang.XlationBase();
OpenAjax.hub.subscribe('site.multilingual.xlation.set',AD.Lang.Xlation.onXlationSwitch);
    