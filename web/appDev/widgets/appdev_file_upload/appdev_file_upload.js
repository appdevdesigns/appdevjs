
AD.Controller.extend("AppdevFileUpload",
{
    init: function(el, options) {
        defaults = {
            urlUpload: null,
            data: {}
        };
        this.options = $.extend(defaults, options);
        
        this.insertDOM();
        this.$progressBar = this.element.find('.progress .bar');
        
        this.initUpload();
    },

    initUpload: function() {
        var self = this;
        
        //// Create and append a new file input element each time.
        //// Becasue some browsers have restrictions about trigerring their
        //// 'click' events more than once.
                
        // Remove any previous file input elements
        this.element.find('input.uploader').remove();
        
        // There is no viewable content in this markup. So let's not use a
        // view for it.
        this.$uploader = $('<input type="file" name="files[]" class="uploader">');
        this.$uploader.css({
            'opacity': 0,
            'width': '1px',
            'height': '1px'
        });
        this.element.append(this.$uploader);
        
        // Init the fileupload plugin
        this.$uploader.fileupload({
            maxFileSize: 16777216,
            autoUpload: true,
            url: this.options.urlUpload,
            //fileTypes: "/^image\/(gif|jpeg|png|pdf|doc)$",
            dataType: 'json',
            formData: this.options.data,
            progress: function(ev, data) {
                //console.log('progress: ' + data.loaded);
                var percentage = Math.round(data.loaded / data.total * 100) + '%';
                self.$progressBar.css('width', percentage);
            }
        });
    },
    
    "button click": function(ev) {
        // We are using a <button> to trigger the the real <input type="file">
        // element, which is ugly and hidden.
        this.$uploader.click();
    },
    
    // This is triggered when the user selects a file from their browser's
    // file upload dialog.
    "input.uploader fileuploadsubmit": function(e, data) {
        this.element.find('button').attr('disabled', 1);
        this.$progressBar
            .css('width', 0)
            .addClass('active')
            .show();
    },
    
    // This is triggered after the upload has completed.
    "input.uploader fileuploaddone": function(e, data) {
        this.$progressBar
            .css('width', '99.7%')
            .removeClass('active');
        this.element.find('button').removeAttr('disabled');
        // Re-initialize the uploader widget after each use
        this.initUpload();
    },
    
    insertDOM: function() {
        this.element.html(this.view('/appDev/widgets/appdev_file_upload/appdev_file_upload.ejs', {}));
    }

});