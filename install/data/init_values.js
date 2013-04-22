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
    dbName:'bobbylocaldev',
    dbPath:'localhost',
    dbUser:'root',
    dbPword:'iaeaae579',
    dbCharset:'-',
    dbType:'-',
    dbPathMySQL:'C:\\\\xampp\\\\mysql\\\\bin\\\\mysql.exe',
    dbPathMySQLDump:'C:\\\\xampp\\\\mysql\\\\bin\\\\mysqldump.exe',
    dbPort:'3306',
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
    emailHost:'securemail.example.com',
    emailPort:'25',
    emailDomain:'localhost',
    emailKey:'-',
    
    // Language Settings
    langDefault:'-',
    langList:'',   // <- not a typo
    
    production:false,
    
    // Admin Account
    adminUserID:'admin',
    adminPWord:'admin',
    adminLanguage:'-',
    
    
    lan:'-',
    title:'-'
};


exports.values = $values;