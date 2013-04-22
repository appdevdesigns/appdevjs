

var path = require('path');
var fs = require('fs');



//-----------------------------------------------------------------------------
var openDefaults = function (req, res, next) {
  // open an existing defaults.js file if it exists
  // req.aRAD.isThere : (BOOL) is there a defaults.js or not
  // req.aRAD.defaultData : contents of defaults.js if isThere == true
  
  req.aRAD = {};
  
  req.aRAD.values = require('./data/init_values.js').values;
  
  console.log('   - openDefaults:');
  var pathDefaultsFile = __dirname+'/../node_modules/defaults.js';
  
  // if default file exists
  fs.exists(pathDefaultsFile, function(isThere) {
      
      // mark whether or not any defaults exist.
      req.aRAD.hasDefaults = isThere; 
      
      if (isThere) {
          
          // read in the file
          fs.readFile(pathDefaultsFile, 'utf8', function (err, data) {
              
              if (err) {
                  
                  // pass along error:
                  AD.Util.Error(req, '**** Errror reading defaults.js file path['+pathDefaultsFile+']  err:'+err);
                  
              } else {
                  
                  // store contents for later step
                  req.aRAD.defaultData = data;
              }
              
              next();
              
          });
          
      } else {
          
          // ! There so continue on
          next();
      }
      
     
  });
}



//-----------------------------------------------------------------------------
var openTemplateDefault = function (req, res, next) {
    // open the defaults.tpl
    // req.aRAD.defaultTemplateData : contents of defaults.tpl if isThere == true
    
    if (req.aRAD.hasDefaults) {
        
       
        console.log('   - openTemplateDefault:');
        var pathDefaultsFile = __dirname+'/data/defaults.tpl';
        
        // if default template file exists
        fs.exists(pathDefaultsFile, function(isThere) {
            
            if (isThere) {
                
                // read in the file
                fs.readFile(pathDefaultsFile, 'utf8', function (err, data) {
                    
                    if (err) {
                        
                        // pass along error:
                        AD.Util.Error(req, '**** Errror reading defaults.tpl file path['+pathDefaultsFile+']  err:'+err);
                        
                    } else {
                        
                        // store contents for later step
                        req.aRAD.defaultTemplateData = data;
                    }
                    
                    next();
                    
                });
                
            } else {
                
                // ! There so continue on
                next();
            }
            
           
        });
        
    } else {
        // we didn't have any defaults, so we just skip this ...
        next();
    }
}



//-----------------------------------------------------------------------------
var gatherDefaultValues = function (req, res, next) {
    // parse through the template data, find our expected template locations, 
    // and pull data from the existing defaults.js data.
    // req.aRAD.values : should now contain the default values from defaults.js
    
    if (req.aRAD.hasDefaults) {
        
        console.log('   - gatherDefaultValues:');

        var tMatches = {};
        var match;
        
        var templateData = req.aRAD.defaultTemplateData;
        var aryTemplateData = templateData.split("\n");
        
//        var listKeysExp = /\[.*]/g;
//        var listKeysExp = new RegExp("\\[([a-zA-Z]+)]","g");
//        while ((match  = listKeysExp.exec(templateData)) != null) {
//            tMatches.push(match[1]);
//        }
//        var result =  req.aRAD.defaultTemplateData.search(listKeysExp);
        
        // foreach of our values:
        for (var key in req.aRAD.values){
            
            // compile a regExp to find if this key is in current line
            var listKeysExp = new RegExp("(\\["+key+"])","g");
            
            // foreach line of our template
            for(var i=0; i<= aryTemplateData.length; i++ ){
                
//console.log('key['+key+']  line['+aryTemplateData[i]+']');

                if ((match = listKeysExp.exec(aryTemplateData[i])) != null) {
                    
                    var parts = aryTemplateData[i].split('['+key+']');
                    // now pull beginning of string
                    var beg = parts[0];
                    // grab remaining string
                    var end = parts[1];
                    
                    var newExpr = beg+"(.+)"+end;
                    
                    tMatches[key] = newExpr;
 //                   console.log(tMatches);
 //                   throw new Error('yow!');
                    
                } // end if match

            } // next line
            
        } // next value
        
 
//console.log('values Before:');
//console.log(req.aRAD.values);
        
        var defaultData = req.aRAD.defaultData;
        
        // foreach found search:
        for(var key in tMatches) {
      
            // create a RegExp for this search
            var expStr = tMatches[key]; //.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");

            var curExpr = new RegExp(expStr,"g");
            
            // if match in data
            if ((match = curExpr.exec(defaultData)) != null) {

                // update values with matched value
                req.aRAD.values[key] = match[1];
                
            } // end if
            
        }// next
        
//console.log( tMatches);
 

        // fix a few of our values:
 
        // dbPath : remove any "'"
        var re = new RegExp("'","g"); 
        req.aRAD.values['dbPath'] = req.aRAD.values['dbPath'].replace(re, "");
        
        // dbType: should be mysql, 
        if (req.aRAD.values['dbType'] == 'DATASTORE_MYSQL') req.aRAD.values['dbType'] = 'mysql';
        if (req.aRAD.values['dbType'] == 'DATASTORE_MEMORY') req.aRAD.values['dbType'] = 'memory';

        
        
        
        
//console.log('values After:');
//console.log(req.aRAD.values);
                       
        next();
       

    } else {
        // we didn't have any defaults, so we just skip this ...
        next();
    }
}







//-----------------------------------------------------------------------------
var openSQL = function (req, res, next) {
    // open an existing setup sql file if it exists
    // req.aRAD.hasSQL : (BOOL) is there a defaults.js or not
    // req.aRAD.sqlData : contents of defaults.js if isThere == true
    
 
    console.log('   - openSQL:');
    var pathSQLFile = __dirname+'/../modules/site/install/data/appDev_setup_mysql.sql';
    
    // if default file exists
    fs.exists(pathSQLFile, function(isThere) {
        
        // mark whether or not any defaults exist.
        req.aRAD.hasSQL = isThere; 
        
        if (isThere) {
            
            // read in the file
            fs.readFile(pathSQLFile, 'utf8', function (err, data) {
                
                if (err) {
                    
                    // pass along error:
                    AD.Util.Error(req, '**** Errror reading defaults.js file path['+pathSQLFile+']  err:'+err);
                    
                } else {
                    
                    // store contents for later step
                    req.aRAD.sqlData = data;
                }
                
                next();
                
            });
            
        } else {
            
            console.log('     no existing sql file.');
            // ! There so continue on
            next();
        }
        
       
    });
}






//-----------------------------------------------------------------------------
var openTemplateSQL = function (req, res, next) {
  // open the defaults.tpl
  // req.aRAD.defaultTemplateData : contents of defaults.tpl if isThere == true
  
  if (req.aRAD.hasSQL) {
      
     
      console.log('   - openTemplateSQL:');
      var pathDefaultsFile = __dirname+'/data/appDev_setup_mysql.tpl';
      
      // if default template file exists
      fs.exists(pathDefaultsFile, function(isThere) {
          
          if (isThere) {
              
              // read in the file
              fs.readFile(pathDefaultsFile, 'utf8', function (err, data) {
                  
                  if (err) {
                      
                      // pass along error:
                      AD.Util.Error(req, '**** Errror reading defaults.tpl file path['+pathDefaultsFile+']  err:'+err);
                      
                  } else {
                      
                      // store contents for later step
                      req.aRAD.sqlTemplateData = data;
                  }
                  
                  next();
                  
              });
              
          } else {
              
              // ! There so continue on
              next();
          }
          
         
      });
      
  } else {
      // we didn't have any defaults, so we just skip this ...
      next();
  }
}



//-----------------------------------------------------------------------------
var gatherSQLValues = function (req, res, next) {
  // parse through the template data, find our expected template locations, 
  // and pull data from the existing defaults.js data.
  // req.aRAD.values : should now contain the default values from defaults.js
  
  if (req.aRAD.hasSQL) {
      
      console.log('   - gatherSQLValues:');

      var tMatches = {};
      var match;
      
      var templateData = req.aRAD.sqlTemplateData;
      var aryTemplateData = templateData.split("\n");
      
//      var listKeysExp = /\[.*]/g;
//      var listKeysExp = new RegExp("\\[([a-zA-Z]+)]","g");
//      while ((match  = listKeysExp.exec(templateData)) != null) {
//          tMatches.push(match[1]);
//      }
//      var result =  req.aRAD.defaultTemplateData.search(listKeysExp);
      
      // foreach of our values:
      for (var key in req.aRAD.values){
          
          // compile a regExp to find if this key is in current line
          var listKeysExp = new RegExp("(\\["+key+"])","g");
          
          // foreach line of our template
          for(var i=0; i<= aryTemplateData.length; i++ ){
              
//console.log('key['+key+']  line['+aryTemplateData[i]+']');

              if ((match = listKeysExp.exec(aryTemplateData[i])) != null) {
                  
                  var parts = aryTemplateData[i].split('['+key+']');
                  // now pull beginning of string
                  var beg = parts[0].replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
                  // grab remaining string
                  var end = parts[1].replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
                  
                  var newExpr = beg+"(.+)"+end;
                  
                  tMatches[key] = newExpr;
//                   console.log(tMatches);
//                   throw new Error('yow!');
                  
              } // end if match

          } // next line
          
      } // next value
      
      // Update tMatches to correct for hard to get Admin Info:
      tMatches['adminLanguage'] = "INSERT INTO `site_viewer` VALUES \\(1,'([^']+)',";
      
//console.log('values Before:');
//console.log(req.aRAD.values);
      
      var defaultData = req.aRAD.sqlData;
      
      // foreach found search:
      for(var key in tMatches) {
    
          // create a RegExp for this search
          var expStr = tMatches[key];
console.log('key['+key+'] expStr['+expStr+']');
          var curExpr = new RegExp(expStr,"g");
          
          // if match in data
          if ((match = curExpr.exec(defaultData)) != null) {

              // update values with matched value
              req.aRAD.values[key] = match[1];
              
          } // end if
          
      }// next
      
//console.log( tMatches);


      // fix a few of our values:
      // reget our adminPWord:
      var expStr = tMatches['adminLanguage'].replace("([^']+)", req.aRAD.values['adminLanguage']) + "'([^']+)',";



      var curExpr = new RegExp(expStr,"g");
      
      // if match in data
      if ((match = curExpr.exec(defaultData)) != null) {


          // update values with matched value
          req.aRAD.values['adminPWord'] = match[1];
          
      } // end if
      
      
      // reget our Admin UserID
      expStr = expStr.replace("([^']+)", req.aRAD.values['adminPWord']) + "'([^']+)',";
      curExpr = new RegExp(expStr,"g");     
      // if match in data
      if ((match = curExpr.exec(defaultData)) != null) {
          // update values with matched value
          req.aRAD.values['adminUserID'] = match[1];
          
      } // end if

      
      // now our AdminPWord is encrypted, so empty that out:
      req.aRAD.values['adminPWord'] = 'admin';
      
//console.log('values After:');
//console.log(req.aRAD.values);
                     
      next();
     

  } else {
      // we didn't have any defaults, so we just skip this ...
      next();
  }
}



var valueStack = [
                        openDefaults,           // open an existing defaults.js file if it exists
                        openTemplateDefault,    // open the defaults.tpl
                        gatherDefaultValues,    // foreach value in defaults.tpl gather the currentValue
                        openSQL,                // open an existing appDev_setup_mysql.sql file if exists
                        openTemplateSQL,        // open the appDev_setup.mysql.tpl
                        gatherSQLValues,        // for each template spacer: pull out the currentValue
//                        compileValues           // copy the index.html template
                       
                    ]; // an array of functions to call in order

//---------------------------------------------------------
app.all('/install/initialValues.js', valueStack, function(req, res, next) {
    // this verifies that a given file exists 
    // used mostly for finding mysql & mysqldump paths
    
    
    // By the time we reach here, our install stack should have 
    // completed all the setup steps.
    
    console.log('=== initialValues ===');
 //   console.log(req.aRAD);
    
    // Redirect Page to site login
    //var appdevDefaults = require('defaults.js');
//    var loginPage = 'http://' + req.headers.host + '/page/site/login'; //appdevDefaults.siteURL
//    res.contentType('application/javascript');
    
    var result = "if (typeof Values == 'undefined') Values = {}; \n Values = {\n";
    
    for(var v in req.aRAD.values) {
        
        result += "    "+v+':"'+ req.aRAD.values[v]+"\",\n";
        
    }
    result += "}\n";
    
    
//    res.writeHead(200, {'Content-Type': 'application/javascript' });
//    res.contentType('application/javascript');
    res.header('Content-Type', 'application/javascript');
    res.send(result);
 

});




