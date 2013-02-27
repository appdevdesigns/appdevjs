/*
 * @class appdev_list_searchable
 * @parent AD_Client.Controller.Widgets
 * 
 * ###Searchable list widget
 * 
 * A Searchable list widget
 *
 */
 
//this widget depends on fg.menu.js to be loaded.  So do that here:
//steal('/scripts/appDev/widgets/appdev_menu_ipod/fg.menu.js').then(function( $ ) {


steal('/appDev/widgets/appdev_list_searchable_new/appdev_list_searchable_new.ejs');

    AD.Controller.extend("AppdevListSearchableNew", 
        {
            //-----------------------------------------------------------------
            init: function (el, options) {
            
                
                var defaults = {
                      gid:'appdev_list_searchable_uuid_notGiven',
                      
                      buttons:{},		// which buttons should be enabled for this widget
                      dataManager:null, // the ListIterator of the data to display
                      height:null,      // css definition of the height property: '220px'
                      listPublish:{},	// { 'event':'event key' } : list of 
                      onSelection:null, // fn(): what happens when an item is selected
                      onUpdate:null,    // fn(): what happens when an item is updated
//                      pageSize:7,
                      showSearchBar:true, // T/F: show the search bar or not
                      template:null,	// view(): the default view template
                      templateEdit:null,// edit(): the edit panel view
                      templateDelete:null, // view():  the delete confirmation view
                      title: null      // the MultilingualLabel Key for the title
                };
                var options = $.extend(defaults, options); 
                
                
                
                ////
                //// Init our default values:
                ////
                this.dataManager = options.dataManager;
                if (!this.onSelection)
                    this.onSelection = options.onSelection;
               
                
                this._selectedEntry = null;
                this._selectEntryID = null;
                this._mode='list';
                this._modeObj = null;
                
                
                this._$buttonBar = null;
                this.listButtons = {};
                this.listButtonTypes = { 
                    refresh:'all', 
                    add:'all', 
                    edit:'selected', 
                    copy:'selected', 
                    'delete':'selected' 
                };
                
                this.providedButtonHandlers = options.buttons;
                
                this.listPublish = options.listPublish;
                
                
                // NOTE: setup templates BEFORE inserting DOM elements,
                //       so we can grab existing templates if they are there.
                // setup any internal panels (delete confirmation, etc..)
                this.initTemplates(options);
                
             // insert our DOM elements
                this.insertDOM();
                
                
                // setup our title (multilingual)
                this.initTitle(options);
                
                // configure our buttons
                this.initButtons(options);
                this.initSearchBar(options);
                
                // setup our forms
                this.initForms(options);
                
                
                // configure our widget size
                // NOTE: keep this after initForms so hidden forms don't affect
                //       height adjustments.
                this.initSize(options);
                
                // initialize our list
                // ## NOTE: kendoui needs the model so it can create a new object with the 
                //          right fields when ADDing a new entry.
/*                this._kendoDataSource = new kendo.data.DataSource({data: [],
//                	pageSize:options.pageSize,
                	
                	schema:{
                		model:{
                			id:"id",
                			fields:{
                				id:{ editable:false},
                				label: { type:'string'}
                			}
                		}
                	}});
*/
                
                if (this.dataManager != null) {
                
                    var loaded = this.dataManager.loaded();
                    var self = this;
                    $.when(loaded).done(function (data) {
                    
                    
                        self.loadFromDataManager();
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                    })
                    .fail(function(data) {
                        // do the bind just in case the first load failed
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                    });

                }
                this.initList();
                
            },
            
            
            

            
            
            
            actionAdd:function(e) {
            	
            	var newEntry = this.dataManager._new();
            	
            	this._formEditContents.html(this._templates.edit());
            	
            	newEntry.bindToForm(this._formEditContents);
            	

            	//// show the edit Form
            	this._formEdit.slideDown('fast');
            	
            	this._mode = 'add';
            	this._modeObj = newEntry;
            	
            	// find the first input element and set that as our focus()
            	var listElements = this._formEdit.find(':input');
            	listElements[0].focus();
//            	this._formEdit.find(':input').focus();
 
//            	e.preventDefault();
            	
            },
            
            

            
            
            
            actionDelete:function(e) {
            	
            	
            	if (this._selectedEntry != null) {
                    
            		this._formDeleteContents.append(this._selectedEntry.clone());
                    
            		//// show the delete confirmation Form
                	this._formDelConf.slideDown('fast');
                	
                	this._mode = 'del';
                	this._modeObj = this._selectedEntry.data('rowMgr');
            	}
            	

            },
            
            
            
            //-----------------------------------------------
            actionDeleteDo: function (ev) {
                // proceed with removing this entry from the DB
            

                 if ((this._mode == 'del') && (this._modeObj != null)) {
                
                    var rowMgr = this._modeObj;
                    
                    var _self = this;
                    
//                    this.busyOn();
                    rowMgr.destroy(function () {
                    
//                        _self.busyOff();
                        _self._selectedEntry.remove();
                        _self._selectedEntry = null;
                        
                        // remove the form.
                        _self.buttonActionCancel(ev);
//                        self.publishMessage('deleted');
                    });
                }
                
            },

            
            
            actionEdit:function(e) {
            	
            	if (this._selectedEntry != null) {

	            	var entry = this._selectedEntry.data('rowMgr');
	            	
	            	this._formEditContents.html(this._templates.edit(entry));
	            	
	            	entry.bindToForm(this._formEditContents);
	            	
	
	            	//// show the edit Form
	            	this._formEdit.slideDown('fast');
	            	
	            	this._mode = 'edit';
	            	this._modeObj = entry;
	            	
	            	// find the first input element and set that as our focus()
	            	var listElements = this._formEdit.find(':input');
	            	listElements[0].focus();

            	}
            	
            },

            
            
            actionRefresh:function(e) {
            	
            	this.dataManager.refresh();
            	
            },
            

            
            //------------------------------------------------------------
            addListItem: function ( rowMgr ) {
/*
                // add a row with this data
            	var template = this._templates.display;
            	for (var i in rowMgr) {
            		if (typeof rowMgr[i] != 'function') {
            			template = AD.Util.String.replaceAll(template, '['+i+']', i)
            		}
            	}
            	template = AD.Util.String.replaceAll(template,'[label]', rowMgr.getLabel());
            	
                var $newRow = $(template);
                $newRow.removeClass('template-row');
                $newRow.addClass('active-row');
                $newRow.addClass('list-item');
                                
                $newRow.data('rowMgr', rowMgr);
                $newRow.attr('key', rowMgr.getID());
                
//                var self = this;
//                $newRow.click(function(ev) { self.onClick(ev); });
                
                this._$listContainer.append($newRow);
*/                
                var $newRow = $('<div class="active-row list-item"></div>');
//                $newRow.html( $('<div>'+this._templates.display+'</div>').render( [{label:rowMgr.getLabel()}]));
                
                $newRow.html( this._templates.display(rowMgr));
               
                                
                $newRow.data('rowMgr', rowMgr);
                $newRow.attr('key', rowMgr.getID());
                
                $newRow.appendTo(this._$listContainer);
            },
            
            
            
            //-----------------------------------------------
            buttonHandler: function (key) {
                // a common handler to process the button clicks.
                //
                // this handler checks to see if a provided handler
                // exists for that button, if so, it will call that
                // one first.  if that handler returns false it will
                // stop the propagation, otherwise we then run our
                // default handler.
            
                var result = true;
                var type = typeof this.providedButtonHandlers[key];
                if (type != 'undefined') {
                
                    if ( type == 'function') {
                        result = this.providedButtonHandlers[key]();
                    } else {
                        result = this.providedButtonHandlers[key];
                    }
                    if (typeof result == 'undefined')  result = true;  // <-- they forgot so assume true
                }
                
                if (result) {
                	var actionKey = 'action'+key.charAt(0).toUpperCase() + key.slice(1);
                    if (typeof this[actionKey] != 'undefined') {
                        this[actionKey]();
                    }
                }

            
            },
            
            
            
            //-----------------------------------------------------------------
            buttonActionCancel: function(e) {
            	// called whenever a cancel button is pressed on one of our
            	// default dialogues  (Add/Edit/Del Confirmation)
            	
            	var form = null;
            	var contents = null;
            	
            	switch( this._mode) {
            	
            		case 'add':
	            	case 'edit':
	            		form = this._formEdit;
	            		contents = this._formEditContents;
	            		break;
	            		
	            	case 'del':
	            		form = this._formDelConf;
	            		contents = this._formDeleteContents;
	            		break;
            	
            	}
            	
            	if (form != null) {
            		
	            	// hide the form.
	            	form.slideUp('fast');
	            	
	            	contents.html('');
	            	
	            	this._mode = 'list';
	            	this._modeObj = null;
            	
            	}
            	e.preventDefault();
            	
            },
            
            
            
            buttonEditSave: function(e) {
            	
            	// we get here from either the Add Form or the Edit form
            	// change button state to not process any more clicks
            	// change button text to indicate processing
            	// set busy icon on
            	
            	// if we are adding
            		// use currModeObj to pullFromForm
            		// currModeObj.save();
            		
            	// else
            		// use currModelObj to pullFromForm
            		// currModelObj.save();
            		// find current entry in list
            		// find prevEntry
            		// remove currEntry
            		// create a new entry from template
            		// insert new template after prevEntry
            	// endif
            	
            	// use curModeObj to pullFromForm
            	this._modeObj.loadFromDOM(this._formEditContents);
            	
            	// currModeObj.save()
            	var saveComplete = this._modeObj.save();
            	
            	var _self = this;
            	
            	// when saveComplete then
            	$.when(saveComplete)
            	 .then(function() {
            		 
            		 // tell listManager to refresh()
            		 // NOTE: we are already setup to redraw our list when
            		 //       our listManager refreshes it's data.
            		 var refreshComplete = _self.dataManager.refresh();
	    			
            		 // when refreshComplete
            		 $.when(refreshComplete)
            		  .then(function(data){
            			  
            			// find new entry in list
  	    				// select entry
            			  _self.selectByID('', _self._modeObj.getID());
            			  
            			  // hide the editPanel now...
            			  _self.buttonActionCancel(e);
            			  
            			  if (_self.onUpdate != null) {
            				  _self.onUpdate();
            			  }
            		  });
	    				
	    			// end
            		
            	 })
            	 .fail(function() {
            		 //
            		 var inHere = true;
            		 
            		 
            	 }); // end
            	
            },
            
            
/*            
            clear: function() {
                // Empty out the data source.
                this._kendoDataSource.data([]);
            },
*/
            

            //-----------------------------------------------
            clearList: function () {
                // empty our current list of entries 
            
            	if (this._$listContainer) {

	                // remove all our items
	                this._$listContainer.find('.list-item').remove();
	                
	                this._selectedEntry = null;
	                this._selectEntryID = null;
	                
	//                this.refreshButtonBar();
            	}
            	
            },
            
            
            
            clearSelection: function() {
                // Empty out the data source.
                //var listView = this.element.find("#listView").data('kendoListView');
                //this._listView.clearSelection();
            	
            	this._$listContainer.find('.list-item-selected').removeClass('list-item-selected');
            },
            
            
            
            
            // Provide a new set of parameters to search on
            findAll:function(params) {
                
                this.dataManager.findAll(params);
            },
            
            
            
            // Provide a new set of parameters to filter the list
            setLookupParams:function(params) {
                
                this.dataManager.setLookupParams(params);
                this.dataManager.refresh();
            },
            
            
            
            //-----------------------------------------------
            initButtons: function(options) {
                
                var _self = this;
                
                // setup add button
//                this.element.find('#btnAdd').click(function(ev) {_self.buttonAdd(ev); });
                
                
// setup our button bar to it's proper initial configuration
                
                this._$buttonBar = this.element.find('.appdev-list-searchable-button-bar');
                
                var _self = this;
                
                for (var bIndx in this.listButtonTypes) {
                
                    var $_button = this._$buttonBar.find('.'+bIndx);
                    if ($_button) {
                    
                        // if an option for that button exists
                        if (typeof options.buttons[bIndx] != 'undefined') {
                        
                            // if button Display type == all
                            if (this.listButtonTypes[bIndx] == 'all') {
                                // show button
                                $_button.show();
                            } else {
                                // hide button
                                $_button.hide();
                            } // end if


                            // closure to the rescue!
                            var assignHandler = function (key) {
                                $_button.click( function () { _self.buttonHandler(key) });
                            }
                            assignHandler(bIndx);
                            this.listButtons[bIndx] = $_button;
                            
                        } else {
                            $_button.hide();
                        } // end if
                    
//                        $_button.button();
                    }
                }
                
            },
            
            
            
            //-----------------------------------------------
            initForms: function(options) {
                
                var _self = this;
                
                // setup edit button
                
                this._formEdit = this.element.find('#editForm');
                this._formEdit.hide(); // make sure it is hidden
                
                // insert provided template into form
                this._formEditContents = this._formEdit.find('#editContent');
                
                
                // setup cancel button
                this._formEdit.find('#btnCancel').click(function(ev){_self.buttonActionCancel(ev); });
                
                // setup Save button 
                this._formEdit.find('#btnSave').click(function(ev){_self.buttonEditSave(ev); });
                
                
                
                this._formDelConf = this.element.find('#deleteForm');
                this._formDelConf.hide();
                this._formDeleteContents = this._formDelConf.find('#deleteContent');
                this._formDelConf.find('#btnCancel').click(function(ev){ _self.buttonActionCancel(ev);});
                this._formDelConf.find('#btnConfirm').click(function(ev){ _self.actionDeleteDo(ev);});
            },
            

            
            insertDOM: function() {
                
                this.element.html(this.view('/appDev/widgets/appdev_list_searchable_new/appdev_list_searchable_new.ejs', {}));
                
            },
            
            
            
            initList: function() {
                
                
                // grab our list element
                // apply the KendoUI list widget
                var _self = this;
 /*               var listView = this.element.find("#listView").kendoListView({
                    template: "<li>${label}</li>",
                    editTemplate:'<li><input type="text" class="span3" data-bind="value:label" name="label" required="required"><button id="saveItem" class="btn btn-small" style="float:right" >Save</button></li>',
                    dataSource: this._kendoDataSource,
                    selectable: true,
                    editable:true,
                    change:function (ev) { _self.selectionChanged(ev); }
                });
                this._listView = listView.data('kendoListView');
*/
                this._$listContainer = this.element.find('.list-container');
                
                
            },
            
            
            
            "#saveItem click": function(el, event) {
            	
            	var inHere = true;
            	this._listView.save();
            	
            	event.preventDefault();
            },
            
            
            
            initPager: function() {
            	
            	
            	this.element.find("#pager").kendoPager({
            		dataSource: this._kendoDataSource
            	});

            	
            },
            
            
            
            initTemplates: function(options) {
                // setup our templates here
            	// templates passed in via options override ones 
            	// that might be present in the widget's <div>
            	
            	// a template can be passed in via 
            	//    - options.template (default view)
            	//	  - an <script id="template-display" ></script> tag in our element
            	//    - or we use a default <%= this.getLabel() %> (boring!)
            	
            	
            	this._templates = {};
            	this._templates.display = null;
            	this._templates.edit = null;
            	
            	var display = '<span class="list-label">[%= this.getLabel() %]</span>';
            	
            	// display template:
            	if (options.template != null) {
            		
            		// this should be a string already:
            		display = options.template;
            		
            	} else {
            		
            		// if a .template-display class is found in our <div> then use that
            		var existingTemplate = this.element.find('#template-display');
            		if(existingTemplate.length > 0) {
            			display = $('<div>').append(existingTemplate[0]).html();
            			$(existingTemplate[0]).remove();
            		}
            		
            	}
            	// Here we should have the proper template string, so convert to a template
            	// store a reference to this display template
            	this._templates.display = $.EJS({text:display, type:'['});
            	
            	
            	
            	//// Find an edit template if provided:
            	var edit = '<input type="text" class="input-small" placeholder="New Entry">';
            	
            	// edit template:
            	if (options.templateEdit != null) {
            		
            		// this should be a string already:
            		edit = options.templateEdit;
            		
            	} else {
            		
            		// if a .template-edit class is found in our <div> then use that
            		var existingTemplate = this.element.find('#template-edit');
            		if(existingTemplate.length > 0) {
            			edit = $('<div>').append(existingTemplate[0]).html();
            			$(existingTemplate[0]).remove();
            		}
            		
            	}
            	// Here we should have the proper template string, so convert to a template
            	// store a reference to this edit template
            	this._templates.edit = $.EJS({text:edit, type:'['});
                
            }, 
            
            
            
            initSearchBar: function(options) {
                // setup the search bar on our widget.
            
                var searchBar = this.element.find('#search-container');
                
                // if options.showSearchBar == true
                if (options.showSearchBar) {
                
                    searchBar.show();
                
                } else {
                
                    searchBar.hide();
                }
                
            }, 
            
            
            
            //-----------------------------------------------
            initSize: function(options) {
                // setup the Title
            
                this._height = this.element.find('.appdev-list-searchable-title');
                
                var providedTitle = '';
                
                // passed in parameters overwrite existing html:
                if ((options.height != null) 
                    && (options.height != '')) {
                    
                	  // set outer height = given height
                	var outerDiv = this.element.find('.appdev-list-searchable');
                    outerDiv.css('height', options.height);
                    
                    var value = parseInt(options.height);
                    
                    var listContainer = this.element.find(".list-container");
                    
                    var outerTop = outerDiv.offset().top;
                    var lcTop = listContainer.offset().top;
                    var diff = lcTop - outerTop;
                    
                    listContainer.css('height', (value-diff));
                      
                }
                
            },
            
            
            
            //-----------------------------------------------
            initTitle: function(options) {
                // setup the Title
            
                this._$title = this.element.find('.appdev-list-searchable-title');
                
                var providedTitle = '';
                
                // passed in parameters overwrite existing html:
                if ((options.title != null) 
                    && (options.title != '')) {
                    
                        providedTitle = options.title;
                    
                } else {
                    // no options.title provided so look at existing
                    var providedTitle = this._$title.html().trim();
                }
                
                
                if (providedTitle != '') {
                
                    // if title is a key
                    var firstChar = providedTitle[0];

                    if (firstChar == '[') {

                        // this should be a key to lookup in labels
                        this._$title.html('');
                        this._$title.append( AD.Lang.Labels.getLabelObj({ key:providedTitle}));

                    } else {

                        // I guess this is supposed to be the title
                        this._$title.html(providedTitle);

                    }
                
                }
                
            },
            
            
            
            //------------------------------------------------------------------
            loadFromDataManager: function(){
                
                // get kendoUI Datasource from our dataManager
                // apply it to our list
                var _self = this;
/*
                this.clear();
                this.dataManager.each(function(row){
                    var label = row.getLabel();
                    var id = row.getID();
                    _self._kendoDataSource.add({label:label, id:id});
                });
                
                
                // now if length of data is > pageSize then
                var kendoPageSize = this._kendoDataSource.pageSize();
                if ((kendoPageSize) && (this.dataManager.length() > kendoPageSize)) {
                	// show Pager
                	var pager = this.element.find('#pager');
                	if (pager.length == 0) {
                		
                		this.element.find('#listArea').append('<div class="k-pager-wrap"><div id="pager"></div></div>');
                		this.initPager();
                	}
                } else {
      
                	// remove pager if present
                }// end if
*/
                // need to clear list first:
                this.clearList();
                
                // now foreach entry in our dataManager:
                var _self = this;
                this.dataManager.each(function( row ) {
                            
                    // add a row
                    _self.addListItem( row );
                    
                });
                
            },
            
            
            
            //-----------------------------------------------
            publishMessage: function (key, data) {
                // publish an OpenAjax message if the given key is 
                // provided.
                
                if (typeof this.listPublish[key] != 'undefined') {
                    AD.Comm.Notification.publish(this.listPublish[key], data);
                }
            
            },

            
            /* 
             * @function refresh
             * @parent appdev_list_searchable
             *
             *  Cause the list to refresh itself from it's given dataManager
             *  
             *  @codestart
             *      this.refresh();
             *  @codeend
             */
            refresh:function() {
            	
            	this.dataManager.refresh();
            	
            },
            
            
            
            //-----------------------------------------------
            refreshButtonBar: function () {
                // rescan the button bar to determine if each button
                // needs to be displayed/hidden
                
                for (var bIndx in this.listButtonTypes) {
                
                
                    if (typeof this.listButtons[bIndx] != 'undefined') {
                    
                        var $_button = this.listButtons[bIndx];
                        
                        // if button Display type == all
                        if (this.listButtonTypes[bIndx] == 'all') {
                            // show button
                            $_button.show();
                        } else {
                            if ( this._selectedEntry != null) {
                            
                                $_button.show();
                    
                            } else {
                                // hide button
                                $_button.hide();
                            }
                        } // end if

                    } // if button defined
                }  // next buttonType
            
            },
            
            
            
            selectionChanged: function(ev) {
                if (this.onSelection != null) {
                    
                    // get the selected item
                    var listView = this.element.find("#listView").data('kendoListView');
                    var index = listView.select().index();
                    if (index >= 0) {
                        var dataItem = this._kendoDataSource.view()[index];
                        
                        var data = this.dataManager.entryByID(dataItem.id);
                        
                        // pass that item to the provided callback
                        this.onSelection(data);
                    }
                }
                
            },
            
            
            
            //-----------------------------------------------
            selectByID: function (topic, data) {
                // Process a request to select the provided entry
                // id.
                //
                // data: (int) 
                
                var self = this;
                this._$listContainer.find('.list-item').each(function (el) {
                
                    var $this = $(this);
                    $rowMgr = $this.data('rowMgr');
                    if ($rowMgr.getID() == data) {
                        self.selectItem($this);
                    }
                });
                
            },
            
            
            
            //-----------------------------------------------
            selectByField: function (topic, data) {
                // Process a request to select the provided entry
                // id.
                //
                // data : { field:'fieldKey', value:'value' }
            
            
                var self = this;
                this._$listContainer.find('.list-item').each(function (el) {
                
                    var $this = $(this);
                    $rowMgr = $this.data('rowMgr');
                    
                    
                    if ($rowMgr[data.field] == data.value) {
                        self.selectItem($this);
                    }
                });
                
                
            },
            
            
            
            //-----------------------------------------------
            selectItem: function ($el) {
                // Mark the given element as having been selected.
            
                
                if ($el != this._selectedEntry) {
                
                    // clear the existing selected item
                    var $selected = this._$listContainer.find('.list-item-selected');
                    $selected.removeClass('list-item-selected');
                    
                    $el.addClass('list-item-selected');
                    this._selectedEntry = $el;
                    
                    
                    
                    // Scroll the selected row into view
                    var $scrollList = $el.parent();
                    $scrollList.scrollTop( $el.position().top + $scrollList.scrollTop() );
                    
                    
                    this.refreshButtonBar();
                    
                    var rowMgr = $el.data('rowMgr');
                    this.publishMessage('selected', rowMgr);
                    
                    
                    if (this.onSelection != null) {
                       this.onSelection(rowMgr);
                    }
                }
            },
            
            
            
            
            //-----------------------------------------------------------------
            //-----------------------------------------------------------------
            //-----------------------------------------------------------------
            ".list-item click" : function (el, event) {
            	
            	this.selectItem(el);
            	
            }
            

            
            
        });
    
    
//});
    
