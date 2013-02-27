/**
 *  This Controller sets up the operation of each row in a component table.
 */

$.Controller('ComponentRow', 
{
    // Static functions
    
    /**
     * @function getAllRows
     *
     * Scans the states of all the checkboxes in the component manager table
     * rows and returns the result.
     */
    getAllRows: function() {
        var components = {};
    
        $('.component-manager table[system]').each(function() {
            var $table = $(this);
            var systemType = $table.attr('system');
            components[systemType] = [];
            
            $table.find('td.installed input').each(function() {
                var $checkbox = $(this);
                components[systemType].push({
                    'name': $checkbox.attr('name'),
                    'installed': $checkbox.attr('checked') ? 1 : 0
                });
            });
            
        });
        
        return components;
    }
    
},
{
    //// This won't be able to account for new components being added
    //// and there doesn't seem to be any good way to do that using 
    //// subscriptions.
    ////
    // 'component.refreshed subscribe': function(called, data) {
    //     var match = data[this.systemType][this.systemName];
    //     if (match) {
    //         this.element.find('td.path').html(match['path']);
    //         if (match['installed']) {
    //             this.element.find('td.checkbox input')
    //                 .attr('checked', 1)
    //                 .removeAttr('disabled');
    //         } else {
    //             this.element.find('td.checkbox input')
    //                 .removeAttr('checked')
    //                 .removeAttr('disabled');
    //         }
    //     }
    //     else {
    //         // The component seems to have been physically deleted
    //         this.element.find('td.checkbox input')
    //             .removeAttr('checked')
    //             .attr('disabled', 1);
    //         this.element.find('td.path').html('deleted');
    //     }
    // }

});

