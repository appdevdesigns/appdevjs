
AD.Controller.extend("AppdevFileUpload",
{
    init: function(el,options){
        
        defaults = {
            name: 'Attach File',
            urlUpload: null,
            data: {}
        };
        
        this.options = $.extend(defaults, options);
        
        this.insertDOM();
        
        this.$progressBar = this.element.find('.progress .bar');
        this.$uploader = this.element.find('input.uploader');
        
        this.initUpload();
    },

    "button click": function(ev){
        // We are using a <button> to trigger the the real <input type="file">
        // element, which is ugly and hidden.
        this.$uploader.click();
    },

    initUpload: function(){
        
        var self = this;
        
        this.$uploader.fileupload({
            maxFileSize: 16777216,
            autoUpload: true,
            url: this.options.urlUpload,
            //fileTypes: "/^image\/(gif|jpeg|png|pdf|doc)$",
            dataType: 'json',
            formData: this.options.data,
            progress: function(ev, data) {
                console.log('progress: ' + data.loaded);
                var percentage = Math.round(data.loaded / data.total * 100) + '%';
                self.$progressBar.css('width', percentage);
            }
        });
        
        this.$uploader.bind('fileuploadsubmit', function(e, data) {
            self.element.find('button').attr('disabled', 1);
            self.$progressBar
                .css('width', 0)
                .addClass('active')
                .show();
        });

        this.$uploader.bind('fileuploaddone', function(e, data) {

            self.$progressBar
                .css('width', '99.7%')
                .removeClass('active');
            self.element.find('.info').html(''
                + 'Name: ' + data.files[0].name + '<br/>'
                + 'Type: ' + data.files[0].type + '<br/>'
                + 'Size: ' + data.files[0].size
            );
            self.element.find('button').removeAttr('disabled');
            
            // Re-initialize the uploader widget
            self.initUpload();
            
        });

    },

    insertDOM: function() {
        this.element.html(this.view('/appDev/widgets/appdev_file_upload/appdev_file_upload.ejs', {}));
    }

});