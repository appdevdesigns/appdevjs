$.Controller('RunTests',{

},
{    
	init: function(el, options) {
		self = this;
		this.selected = null;
		listModules = site.unitTestModules.listIterator({});
		this.$carousel = this.element.find('#unitTestCarousel').appdev_list_carousel({
				dataManager: listModules,
				onSelection: function(el){ self.onSelection(el); },
				onElement:function(rowMgr){
					return '<img src="'+(rowMgr.iconPath || '/site/unitTests/images/icon_application.png')+'" width="75" height="75" alt="">'+
					'<div class="module-name"><h5 align="center">'+rowMgr.getLabel()+ '</h5></div>'
				}
		});
	},
	onSelection: function(el){
		if (this.selected != null){
			this.selected.removeClass('active');
			var div = this.selected.find('.module-active');
			div.remove();
		}
		this.selected = $(el.currentTarget);
		var model = this.selected.data('adModel');
		this.selected.addClass('active');
		var selectedDiv = $('<div class="module-active"></div>');
		selectedDiv.css('width',this.selected.css('width'));
		this.selected.prepend(selectedDiv);
		$('#initCalls').data('initList',model.initList);
		$('#runAll').attr('checked',true);
		$('#listResults').hide();	
		var listFiles = site.unitTestScripts.listIterator({module: model.name});
		var loadedFiles = listFiles.loaded();
		$.when(loadedFiles).done(function(){
			var listFilesData = listFiles.listData;
			$('#listTests').show();
			var clonedRows = $('#listTests').find('.cloneRow');
			clonedRows.remove();
			$('#displayModuleName').html(model.id);
			for (var i = 0; i < listFilesData.length; i++) {
				var tableTemplateRow = $('#listTests').find('.tt-row');
				var newTableRow = tableTemplateRow.clone();
				newTableRow.removeClass('hidden').removeClass('tt-row');
				newTableRow.addClass('cloneRow');
				newTableRow.find('input').attr('id',listFilesData[i].id);
				newTableRow.find('input').attr('checked',true);
				newTableRow.find('.name').html(listFilesData[i].name);
				var trRow = tableTemplateRow.parent();
				if (typeof listFilesData[i].name !== 'undefined' ){
					newTableRow.appendTo(trRow);
				}
			}
		});
	},
	"#runAll click": function(el,event){
		var checkboxes = this.element.find('input:checkbox');
		checkboxes.attr('checked',el.prop('checked'));
		var templateRow = this.element.find('input#fileName');
		templateRow.attr('checked',false);
	},
	"#applyButton click": function(el,event) {
		var checkboxes = this.element.find('input:checkbox:checked');
		var scriptList = [];
		var initList = $('#initCalls').data('initList')|| [];
		for (var a in initList) {
			scriptList.push(initList[a]);
		}
		
		// now that all init/* script are loaded, load mocha
		// NOTE:  put this after our loading of our Models since mocha
		// defines a 'process' object and confuses our Models into thinking
		// we are on the server.
		scriptList.push('/scripts/mocha/mocha.js');
		scriptList.push('/scripts/chai/chai.js');
		scriptList.push('/site/unitTests/scripts/hrefGrep.js');
		
		checkboxes.each(function(index){
			if ($(this).attr('id') !== 'runAll'){
				scriptList.push($(this).attr('id'));
			}
		});

		$('#listTests').hide();
		$('#listResults').show();
		if ($('#iframeListResults').length !== 0){
			$('#iframeListResults').remove();
		}
		var iframe = $('<iframe id="iframeListResults" frameborder=0 width="900" height="600"></iframe>');
		iframe.attr('src','/site/mocha/load?scriptList='+scriptList);
		iframe.appendTo($('#listResults'));
	}
});