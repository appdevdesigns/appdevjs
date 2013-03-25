/**
 *  Setup the Model List Widget
 */


// Keep all variables and functions inside an encapsulated scope
(function() {


    //// Setup Widget:
    AD.Controller.extend('appdevListAdmin', {

        
        //-----------------------------------------------------------------
        init: function (el, options) {

            //// Setup your controller here:
            
            // make sure defaults are taken care of
            var defaults = {
                title:null,         // {string} the AD.Lang.Label.getHTML() Key that displays the label
                buttons:{add:true, del:true, edit:true},
                customButtons: null,
                dataManager:null,   // {object} a provided ListIterator with the items/model instances to display
                modelInstance:null,  // {object} a provided instance of the model to be used to operate the Add Form
                onAdd:null,         // {fn} a callback to use when the [+] button is pressed
                onSelect: null,     // {fn} a callback to call when an item in our list is selected.  param = onSelect(model)
                onDelete:null,      // {fn} a callback to call when an item deletion is confirmed
                templateEdit: null, // {string} a template/function to use when displaying the Edit Form Content
                templateView: null  // {string}/{fn} a template/function to use to display each entry
            };
            var options = $.extend(defaults, options);
            this._super(el, options);
            
            
            this.options = options;
            this.selectedItem = null;
            this.formMode = null;
            this.inModeDel = false;
            
            // setup our templates (before our DOM)
            this.initTemplates();
            
            
            // insert our DOM elements
            this.insertDOM();
            
            
            // attach other widgets & functionality here:
            var self = this;
            
            
            //// Setup our dataManager events
            this.dataReady(this.options.dataManager, function() {
                // onSuccess: load our list and listen for any changes
                self.loadFromDataManager();
            });
            this.options.dataManager.bind('change', this.loadFromDataManager, this);
            
            
            // translate Labels
            // any DOM element that has an attrib "appdLabelKey='xxxx'" will get it's contents
            // replaced with our Label.  Careful to not put this on places that have other content!
            this.xlateLabels();
            
            
            //// store a copy of this controller obj
            //// ( but really, just do element.controller() )
            this.element.data('appdevListAdmin', this);
            this.element.data('appdev_list_admin', this);
            
        },
        
        
        //-----------------------------------------------------------------
        addEntry: function(rowMgr) {
            
            var self = this;
            var html = this.view('/appDev/widgets/appdev_list_admin/appdevListAdmin_entry.ejs', {name:rowMgr.getLabel()});
            var $li = $(html);
            
            $li.data('ad-model', rowMgr);
            $li.attr('model-id', rowMgr.getID());

            $li.click(function(ev){ self.onSelect(ev); });
            $li.find('.ios-delete').click(function(ev){self.onDelSelect(ev);});
            $li.find('.ios-buttons').click(function(ev){self.onDelConfirm(ev);});

            this.list.append($li);
        },
        
        
        
        //-----------------------------------------------------------------
        clearList: function() {
            
            this.list.find('li.appdev-list-admin-entry').remove();
            
            // make sure our del/done is reset
            this.onDone();
        },
        
        
        //-----------------------------------------------------------------
        customButtonHandler:function( handler ) {
            // we don't know what the custom button handler actually wants to do,
            // so let's provide them with a list of any selected Models
            
            var listModels = [];
            
            this.list.find('.active').each(function(indx, el){
            
                var $el = $(el);
                var model = $el.data('ad-model');
                if ('undefined' !== typeof model){
                    listModels.push(model);
                }
            });
            
            if (handler) handler(listModels);
            
        },
        
        
        
        //-----------------------------------------------------------------
        initTemplates: function() {
            // setup our templates here
            // templates passed in via options override ones 
            // that might be present in the widget's <div>
            
            // a template can be passed in via 
            //    - options.template (default view)
            //    - an <script id="template-display" ></script> tag in our element
            //    - or we use a default <%= this.getLabel() %> (boring!)
            
            
            this._templates = {};
            this._templates.edit = null;
            
            
            //// Find an edit template if provided:
            var edit = '<input type="text" class="option-input" placeholder="New Entry">';
            
            // edit template:
            if (this.options.templateEdit != null) {
                
                // this should be a string already:
                edit = this.options.templateEdit;
                
            } else {
                
                // if a .template-edit class is found in our <div> then use that
                var existingTemplate = this.element.find('.template-edit');
                if (existingTemplate.length > 0) {
                    edit = $('<div>').append(existingTemplate[0]).html();
                    $(existingTemplate[0]).remove();
                }
                
            }
            // Here we should have the proper template string, so convert to a template
            // store a reference to this edit template
            this._templates.edit = $.EJS({text:edit, type:'['});
            
        },
        

        
        //-----------------------------------------------------------------
        insertDOM: function() {
            var self = this;
            
            this.element.html(this.view('/appDev/widgets/appdev_list_admin/appdevListAdmin.ejs', {}));
            
            if (this.options.title) {
                this.element.find('.appdevListAdmin-title').html(AD.Lang.Labels.getLabelHTML(this.options.title));
            }
            
            this.addForm = this.element.find('.appdevListAdmin-AddForm');
            this.addForm.find('.add-form-items').html(this._templates.edit());
            
            
            var model;
            if (this.options.modelInstance) {
                model = this.options.modelInstance;
            } else {
                model = this.options.dataManager._new();
            }

            this.addForm.ad_form({ 
                uid:this.uid+'-addform',
                dataManager:model,
                error:'.appdevListAdmin-error',
                submit:'.add-form-btn-submit',
                cancel:'.add-form-btn-cancel',
                onCancel:function(){ return self.onCancel();}
            });
            
            this.ADForm = this.addForm.data('ADForm');
            
            this.addForm.bind('saveDone', function(event, model) {
                
                if (self.formMode == 'add'){
                    
                    // trigger an 'addDone' event
                    self.element.trigger('addDone', model);

                    
                } else {
                    
                    // trigger an 'editDone' event
                    self.element.trigger('editDone', model);
                }

                self.ADForm.clear();
                self.addForm.hide();
                self.setKeyboardFocus(self.uid);
            });

            this.addForm.hide();
            
            
            this.list = this.element.find('.admin-list');
            
            this.button ={};
            this.button.add = this.element.find('.btn-add');
            if (this.options.buttons.add) {
                this.button.add.click(function(event) { self.onAdd(event); });
            } else {
                this.button.add.hide();
            }
            
            this.button.del = this.element.find('.btn-del');
            if (this.options.buttons.del) {
                this.button.del.click(function() { self.onDel(); });
            } else {
                this.button.del.hide();
            }
            
            this.button.done = this.element.find('.btn-done');
            this.button.done.click(function(){ self.onDone();});
            
            this.button.edit = this.element.find('.btn-edit');
            if (this.options.buttons.edit) {
                this.button.edit.click(function(){ self.onEdit();});
            } else {
                this.button.edit.hide();
            }
            
            this.icons = {};
            this.icons.busy = null;
            var iB = this.element.find('.busyicon-inline');
            if (iB.length > 0) {
                this.icons.busy = iB;
                this.icons.busy.hide();
            }
            
            // Populate the custom buttons
            if (this.options.customButtons) {
                var buttonList = this.element.find('.buttons');
                for (var i = 0; i < this.options.customButtons.length; i++) {
                    
                    // OK I don't trust myself to remember the proper format 
                    // for a button definition, so let's make sure some defaults
                    // are in place
                    var buttonDef = {
                            buttonName:'[someButtonTag]',  // let's make this a multilingual key
                            buttonClass:'btn-add',
                            buttonHandler:null
                    }
                    var currentButton = this.options.customButtons[i];
                    var button = $.extend(buttonDef, currentButton);
                    
                    
                    var thisButton = $('<a></a>');
                    thisButton.append(AD.Lang.Labels.getLabelHTML(button.buttonName));
                    thisButton.addClass(button.buttonClass);
                    buttonList.append(thisButton);
                    
                    // we will call our own eventHandler for the button click,
                    // but pass in the handler that should be called when we are ready
                    var self = this;
                    if (button.buttonHandler) {
                        
                        // in order to properly track which button.handler, we need a closure:
                        var buttonHandler = function (button) {
                            var _self = self;
                            thisButton.click(function(){ _self.customButtonHandler(button.buttonHandler)});
                        }
                        buttonHandler(button);
                    }
                }
            }
            // Attach the event handlers for a click on a custom button
        
        
            // we now make our list of objects selectable: jQueryUI
        
        },
        
        
        //-----------------------------------------------------------------
        loadFromDataManager: function() {
            
            var self = this;
            this.clearList();
            this.options.dataManager.each(function(entry){
               
                self.addEntry(entry);
                
            });
            
            
        },
        
        
        
        //-----------------------------------------------------------------
        onAdd: function() {
          
            var defaultAction = true;
            
            // if an add handler is provided
            if (this.options.onAdd) {
            
                // call handler
                defaultAction = this.options.onAdd();  
                if ('undefined' == typeof defaultAction) {
                    // they should specifically return false
                    defaultAction = false; 
                }
            } 
            
            
            // if defaultAction
            if (defaultAction) {
                // show addForm
                this.formMode = 'add';
                this.addForm.show();
                this.addForm.focus();
                
                this.setKeyboardFocus(this.ADForm.uid);
            } // end

            return false;
        },
        
        
        
        //-----------------------------------------------------------------
        onAddCancel: function() {
            
            
        },
        
        
        
        //-----------------------------------------------------------------
        onAddSubmit: function() {
            
            // get a new instance of our model
            var model = this.options.dataManager._new();
            
            // get values from the form
            
            // do a create()
            
        },
        
        
        
        //-----------------------------------------------------------------
        onCancel: function(event, model) {
            
            this.addForm.hide();
            this.ADForm.clear();
            this.setKeyboardFocus(this.uid);
            return true;
        },
        
        
        
        //-----------------------------------------------------------------
        onDel: function(event) {
          
            if (this.options.buttons.del) {
                // show our initial Delete options:
                this.element.find('.pane_left').fadeIn();
                this.element.find('.pane_center').width('66%');
                this.button.del.hide();
                this.button.done.show();
                this.inModeDel = true;
            }
        },
        
        
        
        //-----------------------------------------------------------------
        onDelConfirm: function(event) {
            // get the associated model object for the obj to delete
            var me = $(event.currentTarget);
            var myLI = me.parents('li').first();
            var rowMgr = myLI.data('ad-model');
            
            //// TODO: try something like this.options.model.destroy : true/false                
            var doDefault = true;  // this.options.modelactions.destroy
            
            // if an onDelete is provided then call that
            if (this.options.onDelete) {
                doDefault = this.options.onDelete(rowMgr);
            }
            
            // are we supposed to simply call the model.destroy() method?
            if (doDefault) {
                rowMgr.destroy()
            }
            
            event.stopPropagation();
        },
        
        
        
        //-----------------------------------------------------------------
        onDelSelect: function(event) {
            // they clicked the 'minus' icon next to an entry
            var me = $(event.currentTarget);
            var myDelConf = me.parent().parent().find('.pane_right');
            var myContent = me.parent().parent().find('.pane_center');
            
            // if initial click
            var rotation = me.getRotateAngle();
            if ((rotation == '') || (rotation == 0)) {
                
                // rotate me
                me.rotate({animateTo:90, duration:500, callback: function() {
                 // show the [delete] confirmation
                    myContent.width('54%');
                    myDelConf.show();
                }});
                
                
            } else {
                // unrotate me
                me.rotate({animateTo:0, duration:500, callback:function(){}});
                // hide my [delete] confirmation
                myContent.width('66%');
                myDelConf.hide();
            }// end if
            
       
            event.stopPropagation();  // don't bubble up 
        },
        
        
        
        //-----------------------------------------------------------------
        onDone: function(event) {
            // reset our delete operations
        
            if (this.options.buttons.del) {
                this.element.find('.pane_left').hide();
                this.element.find('.ios-delete').rotate({angle:0});
                this.element.find('.pane_right').hide();
                this.element.find('.pane_center').width('100%');
                this.button.done.hide();
                this.button.del.show();
                this.inModeDel = false;
            }
            
            if (event) event.stopPropagation();
            
        },
        
        
        
        //-----------------------------------------------------------------
        onEdit: function(event) {
          
          // do something here ...
        },
        
        

        //------------------------------------------------------------
        /**
         * @function onKeypress
         *
         * process any keypresses that this widget cares about.
         * 
         * NOTE: this only fires when this widget has been given 
         * keyboard focus.
         * 
         * @param {object} el
         *      DOM element that received the event
         * @param {object} event
         *      The event object that contains more info about the keypress.
         */
        onKeypress: function(el, event) {
            //console.log('appdevListAdmin ['+this.uid+'] charCode['+event.charCode+']');
            switch(event.charCode) {
                case 43:  // [+]
                case 61:  // [=] : sometimes fires 
                    // [ctrl]+[+] : add option
                    if ((event.ctrlKey) && (event.shiftKey)) {
                        if (this['onAdd']) this.onAdd();
                        event.stopPropagation();
                    }
                    break;
                
                case 45: // [-]
                case 31: // [ctl]+[-] ?? 
                    
                    // [ctrl]+[-] : delete option
                    if (event.ctrlKey) {
                        if (!this.inModeDel) {
                            if (this['onDel']) this.onDel();
                        } else {
                            if (this['onDone']) this.onDone();
                        }
                    }
                    break;
                       
            }

        },
        
        
        
        //-----------------------------------------------------------------
        // This is called when an item is clicked on
        onSelect: function(event) {
            
            // highlight only the selected item
            this.list.find('li.active').removeClass('active');
            $(event.currentTarget).addClass('active');

            // call any provided onSelect handler when an item in our list 
            // is selected.
            if (this.options.onSelect) {
                var model = $(event.currentTarget).data('ad-model');
                this.options.onSelect(event, model);
            }
        },
        

        //-----------------------------------------------------------------
        // Clears the selected item
        deSelect: function(event) {
            this.list.find('li').removeClass('active');
        },
        
        
        //-----------------------------------------------------------------
        // Select an item which we know to be in the list
        select: function(model) {
            // Clear previously selected item
            this.deSelect();
            // Select this item
            this.element.find('[model-id=' + model.getID() + ']').addClass('active');
            
            // call any provided onSelect handler when an item in our list 
            // is selected.
            if (this.options.onSelect) {
                this.options.onSelect(null, model);
            }
        }

    });
    
}) ();

