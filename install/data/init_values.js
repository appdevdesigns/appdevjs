/**
 * @class Install.init_values
 * @parent Install
 * 
 * ###
 *
 * This file initializes variables to receive setting values we collect during the installation process 
 * such as;
 * 
 * * Database connection settings
 * * Site authentication settings
 * * CAS settings
 * * Email settings
 * * Language settings
 * * Admin account settings
 */

$values = {
    // DB Values
    dbName:'-',
    dbPath:'-',
    dbUser:'-',
    dbPword:'-',
    dbCharset:'-',
    dbType:'-',
    dbPathMySQL:'-',
    dbPathMySQLDump:'-',
    dbPort:'-',
    dbSocketPath:'-',
    connectType:'-',
    
    
    // Site Authentication Values
    authType:'-',
    sessionSecret:'th3re is n0 sPo0n',
    
    
    // CAS settings
    casHost:'-',
    casPort:'-',
    casPath:'-',
    casPgtCallback: '',
    casSubmodule: '',
    
    // Email Values
    emailMethod:'smtp',
    emailHost:'-',
    emailPort:'-',
    emailDomain:'-',
    emailKey:'-',
    
    // Language Settings
    langDefault:'-',
    langList:'',   // <- not a typo
    
    production:false,
    
    // Admin Account
    adminUserID:'-',
    adminPWord:'-',
    adminLanguage:'-',
    
    
    lan:'-',
    title:'-'
};


exports.values = $values;