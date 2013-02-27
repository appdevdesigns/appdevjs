
	$.Controller.extend("AppdevImageUpload",
	{
		init: function(el,options){
			
			defaults = {
				name: 'Attach Image',
				model: null,
				data: {}
			};
			
			this.options = $.extend(defaults,options);
			
			this.id = null;

			this.model = this.options.model;
			
            this.insertDOM();
			
			this._$el = $(el);
            this._$listOuter = this._$el.find('.appdev-image-upload');
     
			this.initButton();
			
			this.initUpload();
			
			this.initImage();
		},
		initButton:function(){
		    this._$button = this._$listOuter.find('.btn');
		       
		    this._$button.html(this.options.name);
		    this._$button.bind('click',function(event){
		    	var parent = $(this).parent();
		    	_$fileUpload = parent.find('.hide');
		    	_$fileUpload.click();
		    });
		    
		},
		initUpload:function(){
			var findOneUrl = this.model.findOneUrl;
            this._$fileUpload = this._$el.find('.hide');
            this._$fileUploadBar = this._$el.find('.control-group');
            this._$fileUploadBar.css({
				'height': '70px',
				'width': '70px'
            });
			this._$fileUploadBar.progressbar({	
    			value: 0
			});
			this._$progressBar = this._$el.find('.ui-progressbar-value');
			this._$progressBar.css({
				'background': 'url(/theme/default/images/FileUploadImage.jpg)'
			});
			this._$fileUploadBar.hide();
			this._$fileUpload.fileupload({
        		maxFileSize: 16777216,
        		autoUpload: true,
        		url: this.model.createUrl,
        		fileTypes: "/^image\/(gif|jpeg|png|pdf|doc)$",
        		dataType: 'json',
				formData: this.options.data
			});
			this._$fileUpload.bind('fileuploadsubmit',
				function (e, data) {
				var parent = $(this).parent();
		    	var _$fileUploadBar = parent.find('.control-group');
		    	_$fileUploadBar.show();
			});
			this._$fileUpload.bind('fileuploaddone', 
				function (e, data) {
						var parent = $(this).parent();
						var uploadImage = parent.find('img');
						var imgPopUp = parent.find('a');
				        this.id = data.result.data.displayId;
			        	imgPopUp.attr('href',findOneUrl);
						this._$fileUploadBar = parent.find('.control-group');
						this._$fileUploadBar.progressbar('value', 100);
						this._$fileUploadBar.hide();
				        if (data.files[0].type == "application/pdf"){
				        	uploadImage.attr('src','/theme/default/images/pdfImage.jpg');
				        }else if (data.files[0].type == "application/msword"){
				        	uploadImage.attr('src','/theme/default/images/microsoftWordImage.jpg');
				        }else{
				        	uploadImage.attr('src',findOneUrl);
				        }
			});
			this._$fileUpload.bind('fileuploadprogress',
				function (e, data){
					var parent = $(this).parent();
					this._$fileUploadBar = parent.find('.control-group');
					this._$fileUploadBar.progressbar('value', parseInt(data.loaded/ data.total * 100, 10));
			});
		},
		insertDOM: function() {
            this.element.html(this.view('//appDev/widgets/appdev_image_upload/appdev_image_upload.ejs', {}));
        },
        initImage: function(){
        	var parent = $(this).parent();
			var uploadImage = parent.find('img');
        },
        getId: function(){
        	return this.id;
        }
	});