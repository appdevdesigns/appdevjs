var page = require('webpage').create();

function simulateClick(control)
{
    if (document.all)
    {
        control.click();
    }
    else
    {
        var evObj = document.createEvent('MouseEvents');
        evObj.initMouseEvent('click', true, true, window, 1, 12, 345, 7, 220, false, false, true, false, 0, null );
        control.dispatchEvent(evObj);
    }
}

	page.includeJs('http://code.jquery.com/jquery-1.8.3.min.js', function(){
		console.log('jquery injects into page');
	});
    //fname = system.args[1];
    page.open("http://localhost:8088/page/site/unitTests", function (status) {
        //page.uploadFile('input[name=image]', fname);
        //page.evaluate(function () {
    	if (status !== 'success'){
    		console.log('not success');
    	} else {
    		//page.evaluate(function(){
    		//page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js', function() {
    			console.log('got here 1');
    	        //console.log(page.evaluate(function () {
    	        //    return document.getElementById('loginForm').textContent;
    	        //}));
    			var userIdField = page.evaluate(function(){
    	        	return document.getElementsByName("userID");
    			});
    	        	for (var i=0;i<userIdField.length;i++){
    	        		console.log('got here 2');
    	        		userIdField[i].value = 'admin';
    	        		console.log(i);
    	        		console.log('got here 3');
    	        	}
    			var pWordField = page.evaluate(function(){
    				return document.getElementsByName('pWord');
    			});
    			for (var n=0;n<pWordField.length;n++){
    				pWordField[n].value = 'admin';
    				console.log(n);
    				console.log('got here 4');
    			}
    			console.log('got here 5');
    			var submitButton = page.evaluate(function(){
    				return document.getElementsByTagName('button');
    			});
				if (typeof jQuery == 'undefined'){
					console.log('jquery is not defined');
				} else {
					console.log('jquery is defined');
				}
				console.log(jQuery.fn.jquery);
    			for (var m=0;m<submitButton.length;m++){;
    					//page.evaluate(function(){
    						console.log('got here before click');
    						//simulateClick(submitButton[m]);
    						//submitButton[m].click();
    						console.log('got here click');
    					//});
    				//});
    				console.log('got here 6');
    			}
    			//document.getElementsByTagName('button')[0].click();
    		//	});
    //		var data = document.getElementById("loginForm");
    	//	console.log('data = '+data);
    		/*document.querySelector("input[name=pWord]").value = 'admin';
    		//document.querySelector('button').click();
            var liLines = document.querySelectorAll('li');
            for (var i=0;i<liLines.length;i++){
            	var liItem = liLines[i].innerText;
        		console.error('liItem.name = '+liLines[i].name);
            	if (liItem == 'site'){
            		console.error('liItem.innerText = '+liItem.innerText);
            		liLines[i].click();
                    //document.querySelector('button').click();
            	}
            }*/
            //document.querySelector('#applyButton').click();
        //});
    	}
        phantom.exit();
    });