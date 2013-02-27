$.Controller('RunTests',{

},
{    
	init: function(el, options) {
		this.initDropDown();
	},
	initDropDown:function(){
		var listModules = site.unitTestModules.listIterator({});
		var loadedModules = listModules.loaded();
		var self = this;
		$.when(loadedModules).done(function(data){
		  var listModulesData = listModules.listData;
		  for (var a = 0; a < listModulesData.length; a++) {
			var templateRow = self.element.find('.template-row');
			var dropDown = templateRow.parent();
			var newRow = templateRow.clone();
			newRow.removeClass('hidden').removeClass('template-row');
			var aLink = newRow.find('a');
			aLink.html(listModulesData[a].name);
			aLink.attr('id',listModulesData[a].name);
			aLink.data('initList', listModulesData[a].initList);
			aLink.click(function(el,event){
				self.linkClick(this);
			});
			newRow.appendTo(dropDown);
		  }
		});
	},
	linkClick: function(aLink){
		
		var $aLink = $(aLink);
		var id = $aLink.attr('id');
		var initList = $aLink.data('initList');
		
		// get our div
		// add initList to it's data()
		$('#initCalls').data('initList',initList);
		$('#listResults').hide();
		
		var listFiles = site.unitTestScripts.listIterator({module: id});
		var loadedFiles = listFiles.loaded();
		$.when(loadedFiles).done(function(){
			var listFilesData = listFiles.listData;
			$('#listTests').show();
			var clonedRows = $('#listTests').find('.cloneRow');
			clonedRows.remove();
			$('#displayModuleName').html(id);
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