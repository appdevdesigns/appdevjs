/**
 *  This Controller sets up the operation of the "Apply" button.
 */

$.Controller('ApplyButton', 
{

},
{
    init: function(el, options) {
    },

    "click": function(el, event) {
        var rowsState = ComponentRow.getAllRows();
        $.ajax({
            type: 'POST',
            dataType: 'json',
            data: rowsState,
            cache: false,
            url: '/service/site/componentManager/update',
            success: function(data) {
                var url = ''+window.location.href.replace(/\?.*/, '');
                window.location.assign(url);
            },
            error: function(error) {
                console.log(error);
                //window.location.reload();
            }
        
        });
    }

});

