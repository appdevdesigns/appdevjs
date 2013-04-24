
/*
 * @class option_twoColumn
 * @parent AD_Client.Controller.Widgets
 * 
 * ##option_twoColumn Widget
 * 
 * Setup the option_twoColumn Widget
 *
 */

//steal('/test0/delAMundo/view/option_twoColumn.ejs').then(function() {

    // Keep all variables and functions inside an encapsulated scope
    (function() {
    
        var L = AD.Lang.Labels.getLabelHTML;
        
        //// Setup Widget:
        AD.Controller.extend('AppdevOptionTwocolumn', {
    
            
            init: function (el, options) {

                //// Setup your controller here:
                
                // make sure defaults are taken care of
                var defaults = {
                      uid:null,
                      height:'400px',       // {int} how high should the UL lists be?
                      titleCol1:null,       // {string} label key for column 1
                      titleCol2:null,       // {string} label key for column 2
                      dataManagerAll:null,  // {obj} The ListIterator that defines all the options
                      dataManagerSelected:null, // {obj} The ListIterator that defines the selected options
                      onAdd:null,           // {fn} the fn to call each time an option is added fn( arrayModelsAdded )
                      onRemove:null,        // {fn} the fn to call each tiem an option is removed: fn(arrayModelsRemoved)
                      onChange:null,        // {fn} the fn to call when SelectedList is sorted: fn(models) // order of models match the current list
                      templateView:null,    // {string} a templateURL to display each item
                      
                      
/*                      
                      dataManager:null, // the ListIterator of the data to display
                      template:null,	// view(): the default view template
                      templateEdit:null,// veiw(): the edit panel view
                      templateDelete:null, // view():  the delete confirmation view
                      title: null      // the MultilingualLabel Key for the title
*/                      
                };
                var options = $.extend(defaults, options);
                this._super(el, options);
                var self = this;
                
                this.options = options;
                
                if (this.options.uid == null) {
                    this.options.uid = this.element.attr('id');
                }
                
                this.selectedIDs = {};
                this.allIDs = {};
                
                // insert our DOM elements
                this.insertDOM();
                
this.hasListSelectedLoaded = false;    
this.hasListAllLoaded = false;
                // setup our Templates:
 //               this.templates();
                
                
                //// attach other widgets & functionality here:
                
                // init the selected items list:
                this.dataReady(this.options.dataManagerSelected, function(list) {
                    self.loadListSelected();
                });
                this.options.dataManagerSelected.bind('change', this.loadListSelected, this);
                
                this.dataReady(this.options.dataManagerAll, function(){
                    self.loadListAll();
                });
                this.options.dataManagerAll.bind('change', this.loadListAll, this);
                
                
                
                
                // Set up titles
                if (this.options.titleCol1) {
                    this.col1Title.html(L(this.options.titleCol1));
                }
                
                if (this.options.titleCol2) {
                    this.col2Title.html(L(this.options.titleCol2));
                }
                
                
                //// setup Drag & Drop
               this.element.find('.ad-items-all').sortable({
                    opacity: 0.6,
                    distance: 5,
                    cursor: 'move',
                    handle: 'span.ad-draggable',
                    connectWith: '#'+this.options.uid+' .ad-items-selected',
                    update: function(ev, ui) {
                        // do any ajax here
                        // execute callback if it was provided
                        //          if (_callbacks.deleteField && $.isFunction(_callbacks.deleteField)) {
                        //            _callbacks.deleteField($(this).attr('fieldName'));
                        //          }
//var stopHere = true;
//console.log('all: update()');
//console.log(ev);
                    },
                    received: function(ev, ui) {
                        // the all items received an item (removed)
                        
                        var li = $(ui.item);
                        var model = li.data('ad-model');
                        self.onRemove([model]);
                    }
                });
                
                
                this.element.find('.ad-items-selected').sortable({
                    opacity: 0.6,
                    distance: 5,
                    cursor: 'move',
                    handle: 'span.ad-draggable',
                    connectWith: '#'+this.options.uid+' .ad-items-all',
                    change: function(ev, ui) {
                        self.onChange();
                    },
                    update: function(ev, ui) {
                        // c
//console.log('selected: update()');
//console.log(ev);
                    
                         },
                     receive: function(ev, ui) {
                         // called when an item is dragged here:
                         
                         var li = $(ui.item);
                         var model = li.data('ad-model');
                         self.onAdd([model]);
                                             
//console.log('selected: received()');
//console.log(ev);
                         }
                });
                
                
                this.element.find('ul').selectable();
                
                
                // translate Labels
                // any DOM element that has an attrib "appdLabelKey='xxxx'" will get it's contents
                // replaced with our Label.  Careful to not put this on places that have other content!
                this.xlateLabels();
            },
            
            
            
            //-----------------------------------------------------------------
            addItem: function( item, list ) {
                
                var li = $('<li class="ad-draggable" itmID="'+item.getID()+'" ></li>');
                
                
                
                var html = item.getLabel(); // default if no template is provided
                if (this.options.templateView) {
                    html = this.view(this.options.templateView, {model:item});
                }
                
                //// NOTE: using a div here causes problem with the selectable
                var div = $('<span class="ad-draggable"></span>');
                div.append(html);
                
                li.append(div);
                
                
                li.data('ad-model', item);
                
                list.append(li);
                
                
            },
            
            
            
            //-----------------------------------------------------------------
            loadListAll: function() {
                // fully reload the 'All' list:
                
                var self = this;
                
                this.listAll.find('li').remove();
console.log('loading list All ');  
if (self.hasListSelectedLoaded) {
    var stopHere = true;
}
self.hasListAllLoaded = true;

                this.options.dataManagerAll.each(function( item ) {
                    var id = item.getID();
                    if ('undefined' == typeof self.selectedIDs[id]) {
                        self.addItem(item, self.listAll);
                        self.allIDs[id] = 1;
                    }
                });
                
            },
            
            
            
            //-----------------------------------------------------------------
            loadListSelected: function() {
                // fully reload the 'Selected' list
                
                var self = this;
console.log('loading list selected');

                this.selectedIDs = {};
                this.listSelected.find('li').remove();
                
                this.options.dataManagerSelected.each(function( item ) {
self.hasListSelectedLoaded = true;
if (self.hasListAllLoaded) {
    var stopHere = true;
}
                    var id = item.getID();
                    self.addItem(item, self.listSelected);
                    self.selectedIDs[id] = 1;
                    if ('undefined' != typeof self.allIDs[id]) {
                        
                        // this entry was in our 'all' list so remove it
                        self.removeItem(item, self.listAll);
                        delete self.allIDs[id];
                    }
                });
                
            },
            

            
            //-----------------------------------------------------------------
            insertDOM: function() {
                
                this.element.html(this.view('/appDev/widgets/appdev_option_twocolumn/appdev_option_twocolumn.ejs', {}));
                
                this.element.find('.ulContainer').css('height', this.options.height);
                
                this.col1Title = this.element.find('.ad-title-col1');
                this.col2Title = this.element.find('.ad-title-col2');
                
                
                this.listAll = this.element.find('.ad-items-all'); 
                this.listSelected = this.element.find('.ad-items-selected');
                
                this.element.find('.add-button').button();
                this.element.find('.delete-button').button();
                
            },
            
            
            
            //-----------------------------------------------------------------
            itemSelected: function (el, ev) {
                // update the list to include this item as selected
                
                var li = $(el);  // assume we are the <li> element
                
                // if we got here on a <span> click then move to upper <li>
                if (li.prop('nodeName') == 'SPAN') {
                    li = li.parent();
                }
                
                
                // if they didn't hold down the ctrl/meta/shift key
                if (!(ev.shiftKey || ev.metaKey || ev.ctrlKey)) {
                    
                    // remove any other selections
                    var ul = li.parent();
                    ul.find('.ui-selected').removeClass('ui-selected');
                }
                
                
                li.addClass('ui-selected');
            },
            
            
            
            //-----------------------------------------------------------------
            onAdd:function( models ) {
                // called when an element is added to the selected box
                // {array} models : one or more models that have been added
                //
                
                if (!$.isArray( models)) models = [models];
                
                if (models.length > 0) {
                    
                    
                    // make sure all these are tracked in our selectedIDs
                    for (var i=0; i<models.length; i++) {
                        var id = models[i].getID();
                        
                        this.selectedIDs[id] = 1;
                        
                        // make sure it is not in our allIDs list
                        if ('undefined' != typeof this.allIDs[id]) {
                            delete this.allIDs[id];
                        }
                    }
                    
                    
                    // pass this list off to any onAdd handler provided
                    if (this.options.onAdd) {
                        this.options.onAdd(models);
                    }
                    
                    
                    // trigger an added event
                    this.element.trigger('added', models);
                }
            },
            
            
            
            //-----------------------------------------------------------------
            onChange:function() {
                // called when the order of elements in selectList is changed
                
                var allItems = this.listSelected.find('li');
                
                // gather list of current entries
                var listModels = [];
                allItems.each(function() {
                    var model = $(this).data('ad-model');
                    listModels.push(model);
                });
                
                
                // send to any onChange() handler
                if (this.options.onChange) {
                    this.options.onChange(listModels);
                }
                
                // trigger changed event
                this.element.trigger('changed', listModels);
            },
            
            
            
            //-----------------------------------------------------------------
            onRemove:function( models ) {
                // called when an element is removed from the selected box
                // {array] models : one or more models 
                
                if (!$.isArray( models)) models = [models];
                
                if (models.length > 0) {
                
                
                    // make sure all these are tracked in our allIDs
                    for (var i=0; i<models.length; i++) {
                        var id = models[i].getID();
                        
                        this.allIDs[id] = 1;
                        
                        // make sure it is not in our selectedIDs list
                        if ('undefined' != typeof this.selectedIDs[id]) {
                            delete this.selectedIDs[id];
                        }
                    }
                    
                    
                    // pass this list off to any onRemove handler provided
                    if (this.options.onRemove) {
                        this.options.onRemove(models);
                    }
                    
                    
                    // trigger an added event
                    this.element.trigger('removed', models);
                }
            },
            
            
            
            //-----------------------------------------------------------------
            onSelection:function( model ) {
                // called when an element is added to the selected box
                // 
                
                if (this.options.onSelection) {
                    
                    this.options.onSelection(model);
                }
                
                this.element.trigger('selected', model);
                
            },
            

            
            //-----------------------------------------------------------------
            removeItem: function(item, list) {
                // remove the given item from the list
                
                var li = list.find('[itmID="'+item.getID()+'"]');
                
                li.remove();
                
            },
            
            
            
            //-----------------------------------------------------------------
            '.ad-items-all span click':function(el, ev) {
                // spans need to update the selected status too
                
                this.itemSelected(el,ev);
            },
            
            
            
            //-----------------------------------------------------------------
            '.ad-items-all li dblclick':function(el) {
                
                this.listSelected.append(el);
                
                // adjust selected
                this.itemSelected(el, {shiftKey:false, metaKey:false, ctrlKey:false });
                
                var li = $(el);
                var model = li.data('ad-model');
                this.onAdd([model]);
                
            },
            
            
            
            //-----------------------------------------------------------------
            '.ad-items-selected span click':function(el,ev) {
                // spans need to update the selected status too
                
                this.itemSelected(el,ev);
            },
            
            
            
            //-----------------------------------------------------------------
            '.ad-items-selected li dblclick':function(el) {
                
                this.listAll.append(el);
                
                // adjust selected
                this.itemSelected(el, {shiftKey:false, metaKey:false, ctrlKey:false });
                
                var li = $(el);
                var model = li.data('ad-model');
                this.onRemove([model]);
                
            },
            
            
            
            //-----------------------------------------------------------------
            '.add-button click':function(el) {
                
                var selectedItems = this.listAll.find('li.ui-selected');
                this.listSelected.append(selectedItems);
                
                // get a list of Models from the selected elements
                var listModels = [];
                selectedItems.each(function(){
                    var model = $(this).data('ad-model');
                    listModels.push(model);
                });
                
                // pass to our onAdd routine
                this.onAdd(listModels);
            },
            
            
            
            //-----------------------------------------------------------------
            '.delete-button click':function(el) {
                
                var selectedItems = this.listSelected.find('li.ui-selected');
                this.listAll.append(selectedItems);
                
                // get a list of Models from the selected elements
                var listModels = [];
                selectedItems.each(function(){
                    var model = $(this).data('ad-model');
                    listModels.push(model);
                });
                
                // pass to our onAdd routine
                this.onRemove(listModels);
            },
            
            
            
            
//// To setup default functionality
/*
            '.col1 li dblclick' : function (e) {
            
                this.element.find('#someDiv').append(e);
            },
*/

//// To Add Subscriptions:
/*
            'apprad.module.selected subscribe': function(message, data) {
                // data should be { name:'[moduleName]' }
                this.module = data.name;
                this.setLookupParams({module: data.name});
            },
*/
        });
        
    }) ();

// });  // end steal
