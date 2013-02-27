/**
 * @class Install.labels_en
 * @parent Install
 * 
 * ###labels_en.js
 *
 * This file contains the text labels displayed during the different steps of the 
 * installation wizard;
 * 
 * * Step 1: Database setup
 * * Step 2: Site authentication setup
 * * Step 3: CAS authentication setup
 * * Step 4: Email setup
 * * Step 5: Language setup
 * * Step 6: Admin account setup
 */


if (typeof $labels == 'undefined') {
    $labels = {};
}

$labels[ 'title_Intro' ] = 'Intro';
$labels[ 'text_Intro' ] = 'Welcome to the appDev installer. Please take a few minutes to fill out the following questions so we can set things up for you.';

$labels[ 'button_Continue' ] = 'Continue';



//// Tab Steps
$labels[ 'label_Step1' ] = 'Step 1';
$labels[ 'label_Step2' ] = 'Step 2';
$labels[ 'label_Step3' ] = 'Step 3';
$labels[ 'label_Step4' ] = 'Step 4';
$labels[ 'label_Step5' ] = 'Step 5';
$labels[ 'label_Step6' ] = 'Step 6';



//// Button Labels
$labels[ 'label_btn_back' ] = '< Back';
$labels[ 'label_btn_next' ] = 'Next >';
$labels[ 'label_btn_done' ] = 'Done';



//// DB Related 
$labels[ 'title_DB' ] = 'Database Setup';
$labels[ 'text_DB' ] = 'Fill in the following fields to setup your DB connectivity:';
$labels[ 'label_dbName' ] = 'Name:';
//$labels[ 'error_dbName' ] = 'Enter the Database Name';
$labels[ 'label_dbPath' ] = 'Path to DB:';
$labels[ 'label_dbPath_ex' ] = 'eg. localhost';
$labels[ 'label_connectUsing' ] = 'Connect Using:';
$labels[ 'label_urlPort' ] = 'URL & Port:';
$labels[ 'label_socket' ] = 'Unix Socket:';
$labels[ 'label_dbPort' ] = 'Port:';
$labels[ 'label_dbPort_ex' ] = 'eg. 3306';
$labels[ 'label_dbSocketPath' ] = 'Path to socket:';
$labels[ 'label_dbSocketPath_ex' ] = 'eg. /tmp/mysql.sock';
//$labels[ 'error_dbPath' ] = 'Enter the Path to DB';
$labels[ 'label_dbUser' ] = 'User Name:';
//$labels[ 'error_dbUser' ] = 'Enter the User Name';
$labels[ 'label_dbPword'] = 'Password:';
//$labels[ 'error_dbPword'] = 'Enter the Password';

$labels[ 'label_dbIncrementalUpdate' ] = 'Install mode:';
$labels[ 'label_cleanInstall' ] = 'Clean Install';
$labels[ 'label_incrementalUpdate' ] = 'Incremental Update';
$labels[ 'label_dbVersion' ] = 'DB version (optional):';

$labels[ 'label_dbCharset'] = 'Character set:';
//$labels[ 'error_dbCharset'] = 'Choose the Character set';

$labels[ 'label_dbType'] = 'Type:';
//$labels[ 'error_dbType'] = 'Choose the Database Type';


$labels[ 'label_db_path' ] = 'Path To Executables';
$labels[ 'label_db_path_mysql' ] = 'MySQL'; // path to MySQL executable
$labels[ 'label_db_path_mysql_ex' ] = 'eg. /usr/bin/mysql';
$labels[ 'label_db_path_mysql_ex2' ] = '/Applications/MAMP/Library/bin/mysql';
$labels[ 'label_db_path_mysqldump' ] = 'MySQLDump'; // path to MySQLDump exec ... 
$labels[ 'label_db_path_mysqldump_ex' ] = 'eg. /usr/bin/mysqldump';
//$labels[ 'label_db_path_mysqldump_ex2' ] = 'eg. /Applications/MAMP/bin/mysql';





//// Authentication Type Related 
$labels[ 'title_AuthType' ] = 'Authentication';
$labels[ 'text_AuthType' ] = 'Choose the Type of Authentication Method: local DB lookup, or CAS';
$labels[ 'text_AuthType2' ] = 'If CAS is chosen, fill in the additional information below.';
$labels[ 'label_authType' ] = 'Type';
$labels[ 'label_authType_local' ] = 'local';  // local db lookup option


////Email Type Related 
$labels[ 'title_EmailType' ] = 'Email Setup';
$labels[ 'text_EmailType' ] = 'Fill in the following fields to set up email capability for appDev';
$labels[ 'label_emailHost' ] = 'Hostname';
$labels[ 'label_emailHost_ex'] = '(e.g. securemail.example.com)';
$labels[ 'label_emailPort' ] = 'Port';
$labels[ 'label_emailPort_ex' ] = '(e.g. 25)';
$labels[ 'label_emailDomain' ] = 'Domain';
$labels[ 'label_emailDomain_ex' ] = '(e.g. localhost)';
$labels[ 'label_emailMethod' ] = 'Email Method';
$labels[ 'label_emailMethod_smtp' ] = 'SMTP';
$labels[ 'label_emailMethod_mandrill' ] = 'Mandrill';
$labels[ 'label_emailKey' ] = 'Mandrill API Key';



// CAS & LDAP Information Related
$labels[ 'title_CasInfo' ] = 'CAS Server';
//$labels[ 'text_CasInfo' ] = 'Enter the information below as specified';
$labels[ 'label_casHost' ] = 'Hostname';
$labels[ 'label_casHost_ex'] = '(e.g. signin.appdevdesigns.net)';
$labels[ 'label_casPort' ] = 'Port';
$labels[ 'label_casPort_ex' ] = '(e.g. 443)';
$labels[ 'label_casPath' ] = 'Path';
$labels[ 'label_casPath_ex' ] = '(e.g. /cas)';
$labels[ 'label_casPgtCallback' ] = 'PGT Callback URL';
$labels[ 'label_casPgtCallback_ex' ] = '(optional | e.g. https://callback.example.com/)';
$labels[ 'label_casSubmodule' ] = 'GUID submodule';
$labels[ 'label_casSubmodule_ex' ] = '(optional)';



//// Admin Account Related 
$labels[ 'title_AdminAccount' ] = 'Administrator Setup';  //'Admin Account';
$labels[ 'text_AdminAccount' ] = 'Enter the information for the admin account:';
$labels[ 'label_adminUserID' ] = 'Account ID:';
//$labels[ 'error_adminUserID' ] = 'Enter the Account ID';

$labels[ 'label_adminPWord' ] = 'Password:';
//$labels[ 'error_adminPWord' ] = 'Enter the Password';

$labels[ 'label_adminLanguage' ] = 'Default Language:';
$labels[ 'error_adminLanguage' ] = 'Enter the Default Language';


$labels[ 'label_siteURL' ] = 'Site URL:';
$labels[ 'label_sitePort' ] = 'Site Port:';

$labels[ 'label_production' ] = 'Site type:';



//// Site Language Related 
$labels[ 'title_LanguageInfo' ] = 'Language Setup';
$labels[ 'text_LanguageInfo' ] = 'Enter the information for the languages on the site.';


$labels[ 'label_langDefault' ] = 'Site Default Language:';
//$labels[ 'error_langDefault' ] = 'Enter the Site\'s Default Language';
$labels[ 'label_langList' ] = 'Initial languages';




//// Review Page Related 
$labels[ 'title_Review' ] = 'Review & Install';
$labels[ 'text_Review1' ] = 'Review your information now.';
$labels[ 'text_Review2' ] = 'If you need to make changes, then press the appropriate tab and update your information.';
$labels[ 'text_Review3' ] = 'If everything looks correct, then press [Done] and we will create the site.  ';

$labels['label_committing'] = 'committing ...';


//// Summary Titles:
$labels[ 'title_DB_Summary' ] = 'DB Setup';
$labels[ 'title_Auth_Summary' ] = 'Auth Setup';
$labels[ 'title_Email_Summary' ] = 'Email Setup';
$labels[ 'title_Lang_Summary' ] = 'Language';
$labels[ 'title_Admin_Summary' ] = 'Admin';
$labels[ 'title_Response_Summary' ] = 'Response';



//// Error Messages:
$labels[ 'error_required' ] = 'required';
$labels[ 'error_ImproperFormatLang' ] = 'Error: language setting not proper format';

