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




    AD.Controller.extend("AppdevListSearchable", 
        {
            // This object will transform the data in a menu 
            
            
            
            init: function (el, options) {
            
                
                var defaults = {
                      gid:'appdev_list_searchable_uuid_notGiven',
                      title: null,      // the MultilingualLabel Key for the title
                      buttons:{
                        },
                      listPublish:{},   // a list of event=>publishKeys 
                      showSearchBar:true,
                      dataManager:null
                };
                var options = $.extend(defaults, options); 
                
                
                
                // Init our default values:
                
                this._$el = $(el);
                this._$listOuter = this._$el.find('.appdev-list-searchable');
                
                this._$title = null;
                this._$buttonBar = null;
                this.listButtons = {};
                this.listButtonTypes = { 
                    refresh:'all', 
                    add:'all', 
                    edit:'selected', 
                    copy:'selected', 
                    'delete':'selected' 
                };
                
                this.listPublish = options.listPublish;
                this._selectedEntry = null; // which dom obj is currently selected
                
                this.providedButtonHandlers = options.buttons;
                
                
                // if $listOuter is not found, then create it:
                
                
                
                // deleteConfirmation
                this._$deleteConf = this._$listOuter.find('.delete-conf');
                this._$deleteConf.hide();
                
                
                
                
                // update our Title
                // 
                this.initTitle(options);
                
                // init our button bar:
                this.initButtonBar(options);
                this.initDeleteConfirmation();
                this.initSearchBar(options);
                
                this._$listContainer = this._$listOuter.find('.list-container');
                
                // initialize data in list (if dataManager is loaded)
                this.dataManager = options.dataManager;
                if (this.dataManager != null) {
                
                    var loaded = this.dataManager.loaded();
                    var self = this;
                    $.when(loaded).done(function (data) {
                    
                    
                        self.loadFromDataManager();
                        self.dataManager.bind('change', self.loadFromDataManager, self);
                        
                    });
                    
                    
                
                }
            
                //// Setup Actions to listen to published events:
                //  selectByID: 
                //  selectByField: 
                //  refresh
                var self = this;
                OpenAjax.hub.subscribe(options.gid+'.selectByID', function(topic, data){ self.selectByID(topic, data); });
                OpenAjax.hub.subscribe(options.gid+'.selectByField', function(topic, data){  self.selectByField(topic, data); });
                OpenAjax.hub.subscribe(options.gid+'.refresh', function(topic, data){  self.refresh(); });
                
                var lastHere = true;
            }, 
            
            
            
            //------------------------------------------------------------
            addListItem: function ( rowMgr ) {
                // add a row with this data
                var $newRow = this._$listContainer.find('.template-row').clone();
                $newRow.removeClass('template-row');
                $newRow.addClass('active-row');
                $newRow.addClass('list-item');
                $newRow.find('.list-label').html(rowMgr.getLabel());
                
                $newRow.data('rowMgr', rowMgr);
                $newRow.attr('key', rowMgr.getID());
                
                var self = this;
                $newRow.click(function(ev) { self.onClick(ev); });
                
                this._$listContainer.append($newRow);
                
            },
            
            
            
            //-----------------------------------------------
            busyOff: function () {
                // show the busy indicator on this widget
            
                this._$listOuter.removeClass('appdev-list-searchable-busy');
            
            },
            
            
            
            //-----------------------------------------------
            busyOn: function () {
                // show the busy indicator on this widget
            
                this._$listOuter.addClass('appdev-list-searchable-busy');
            
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
                    if (typeof this[key] != 'undefined') {
                        this[key]();
                    }
                }

            
            },
            
            
            
            //-----------------------------------------------
            clearList: function () {
                // empty our current list of entries 
            
                // remove all our items
                this._$listOuter.find('.list-item').remove();
                
                this._selectedEntry = null;
                this.refreshButtonBar();
/*
    _list = [];
    _listIndexByKey = {};
    $_autocomplete.autocomplete('disable');
*/
            
            },
            
            
            
            //-----------------------------------------------
            'delete': function () {
            
                if (this._selectedEntry != null) {
                
                    var rowMgr = this._selectedEntry.data('rowMgr');
                    this.showDeleteConfirmation(rowMgr);
                }
            
            },
            
            
            
            //-----------------------------------------------
            destroy: function (topic, data) {
                // cleanly remove our changes to the DOM
            

                // be sure to call this!
                this._super();
                
            },
            
            
            
            //-----------------------------------------------
            doDelete: function () {
                // proceed with removing this entry from the DB
            

                 if (this._selectedEntry != null) {
                
                    var rowMgr = this._selectedEntry.data('rowMgr');
                    
                    var self = this;
                    
                    this.busyOn();
                    rowMgr.destroy(function () {
                    
                        self.busyOff();
                        self._selectedEntry.remove();
                        self._selectedEntry = null;
                        self.hideDeleteConfirmation();
                        self.publishMessage('deleted');
                    });
                }
                
            },
            
            
            
            //-----------------------------------------------
            hideDeleteConfirmation: function () {
                // cleanly remove our changes to the DOM
            
                this._$deleteConf.find('.delete-item').html( '' );
                this._$deleteConf.slideUp('fast');
                
            },
            
            
            
            //------------------------------------------------------------
            initButtonBar: function(options) {
                // setup our button bar to it's proper initial configuration
                
                this._$buttonBar = this._$listOuter.find('.appdev-list-searchable-button-bar');
                
                var self = this;
                
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
                                $_button.click( function () { self.buttonHandler(key) });
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
            
            
            
            //------------------------------------------------------------
            initDeleteConfirmation: function(options) {
                // setup the Delete Confirmation
                
                this._$deleteConf = this._$listOuter.find('.delete-conf');
                
                
                // replace labels with current multilingual version:
                var listLabels = [
                    { div:'#deleteDiv', key:'[AD.List.Searchable.Delete:]' },
                    { div:'#r-u-sure', key:'[AD.List.Searchable.Sure]' },
                    { div:'.delete-no', key:'[AD.List.Searchable.No]' },
                    { div:'.delete-yes', key:'[AD.List.Searchable.Yes]' }
                ];
                    
                for (var indx=0; indx<listLabels.length; indx++) {
                
                    var labelObj = listLabels[indx];
                    var $div = this._$deleteConf.find(labelObj.div);
                    $div.html('');
                    $div.append(AD.Lang.Labels.getLabelObj({ key:labelObj.key}));
                }  
                
                var self = this;
                this._$deleteConf.find('.delete-no').click(function () {
                        self.hideDeleteConfirmation();
                        });
                
                
                this._$deleteConf.find('.delete-yes').click(function () {
                        self.doDelete();
                        });
                
            },
            
            
            
            //-----------------------------------------------
            initSearchBar: function(options) {
                // setup the search bar on our widget.
            
                this._$searchBar = this._$listOuter.find('.search-container');
                
                // if options.showSearchBar == true
                if (options.showSearchBar) {
                
                    this._$searchBar.show();
                
                } else {
                
                    this._$searchBar.hide();
                }
                
            }, 
            
            
            
            //-----------------------------------------------
            initTitle: function(options) {
                // setup the Title
            
                this._$title = this._$listOuter.find('.appdev-list-searchable-title');
                
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
            
            
            
            //-----------------------------------------------
            loadFromDataManager: function () {
                // create my list of options from our dataManager
            
                // need to clear list first:
                this.clearList();
                
                // now foreach entry in our dataManager:
                var self = this;
                this.dataManager.each(function( row ) {
                            
                    // add a row
                    self.addListItem( row );
                    
                });
            
            },
            
            
            
            //-----------------------------------------------
            onClick: function (ev) {
                // the handler for when a list item is clicked
                
                var $el = $(ev.currentTarget);
                this.selectItem($el);
  
            },
            
            
            
            //-----------------------------------------------
            publishMessage: function (key, data) {
                // publish an OpenAjax message if the given key is 
                // provided.
                
                if (typeof this.listPublish[key] != 'undefined') {
                    OpenAjax.hub.publish(this.listPublish[key], data);
                }
            
            },
            
            
            
            //-----------------------------------------------
            refresh: function () {
                // refresh our list of data from the dataManager
                // 
                // NOTE: since we have bound 'change' to our
                //       loadFromDataManager() method, we just
                //       let the dataManager refresh itself.
                
                this.busyOn();
                var refresh = this.dataManager.refresh();
                
                var self = this;
                $.when(refresh).done(function() {
                    self.busyOff();
                    self.publishMessage('refreshed');
                });
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
                    
                    
                }
            },
            
            
            
            //-----------------------------------------------
            showDeleteConfirmation: function ( rowMrg ) {
            
                
                var val = rowMrg.getLabel();
                this._$deleteConf.find('.delete-item').html( val );
                this._$deleteConf.slideDown('fast');
            
            },
            
            
            
            //-----------------------------------------------
            '.clear-search click': function() {
            
                var inHere = true;
            },
            
            
            
            //-----------------------------------------------
            'button': function (el, data) {
            
            
                var inHere = true;
            }
            
            
        });
    
    
//});
    
