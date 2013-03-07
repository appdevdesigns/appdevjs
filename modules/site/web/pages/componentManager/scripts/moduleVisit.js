

/**
 * @class [moduleName].client.pages.moduleVisit
 * @parent [moduleName].client.pages.moduleVisit
 * 
 *  Setup the moduleVisit Widget
 */

//steal('/site/componentManager/view/moduleVisit.ejs').then(function() {

    // Keep all variables and functions inside an encapsulated scope
    (function() {
    
    
        //// Setup Widget:
        AD.Controller.extend('moduleVisit', {
    
            
            init: function (el, options) {

                //// Setup your controller here:
                
                // make sure defaults are taken care of
                var defaults = {
                      uid:'moduleVisit_uuid_notGiven',
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
                this.element.find('.header-row').append('<th>Pages</th>');
                
                // For each module in the list
                this.element.find('.component-row').each(function() {

                    // If the module is installed:
                    if ($(this).find('input').attr('checked')) {
                        // module name in this row
                        var moduleName = $(this).find('.name').text();
                        var _this = $(this);
                        site.Page.findAll({module:moduleName},function(list) {
                            var listPages = '';
                            for (var i = 0; i<list.length; i++) {
                                var name = list[i].name;
                                var path = '/page/'+moduleName+'/'+name;
                                var html = '<a href="'+path+'">'+name+'</a>';
                                listPages += (html + ' ');
                            }
                            _this.append('<td class="pageList">'+listPages+'</td>');
                        });
                    } else {
                        $(this).append('<td>&nbsp;</td>');
                    }
                });
                var _this = this;
                //site.Page.findAll({module:
                
                // attach other widgets & functionality here:
                
                
                
                // translate Labels
                // any DOM element that has an attrib "appdLabelKey='xxxx'" will get it's contents
                // replaced with our Label.  Careful to not put this on places that have other content!
                this.xlateLabels();
            },
            

            
        });
        
    }) ();

// });  // end steal
