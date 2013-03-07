

/**
 * @class [moduleName].client.pages.moduleList
 * @parent [moduleName].client.pages.moduleList
 * 
 *  Setup the moduleList Widget
 */

//steal('/site/welcome/view/moduleList.ejs').then(function() {

    // Keep all variables and functions inside an encapsulated scope
    (function() {
    
    
        //// Setup Widget:
        AD.Controller.extend('moduleList', {
    
            
            init: function (el, options) {

                //// Setup your controller here:
                
                // make sure defaults are taken care of
                var defaults = {
                      uid:'moduleList_uuid_notGiven',
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
                
                
                this.options = options;
                
                
                // insert our DOM elements
                this.insertDOM();
                
                
                // attach other widgets & functionality here:
                this.loadData();
                
                
                // translate Labels
                // any DOM element that has an attrib "appdLabelKey='xxxx'" will get it's contents
                // replaced with our Label.  Careful to not put this on places that have other content!
                this.xlateLabels();
            },
            

            
            insertDOM: function() {
                
                this.element.html(this.view('/site/welcome/view/moduleList.ejs', {}));
                
            },
            
            loadData: function() {
                var _this = this;
                site.Module.findAll({}, function(list) {
                    for(var i=0;i<list.length;i++) {
                        var li = $('<li>'+list[i].name+'</li>');
                        _this.element.find('ul').append(li);
                     }
                });
            }
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
