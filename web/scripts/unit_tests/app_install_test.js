steal("funcunit").then(function() {

	module("testinstall", {
		setup : function() {
			S.open('http://localhost:8088/appDevInstall')
		}
	});
	
	test("do install", function() {
		//wizard page 1
		S('#wizard-1 .wiz-content #dbName').visible().click().type("[ctrl]a[ctrl-up]\b").type("appdev").val("appdev")
		S('#wizard-1 .wiz-content #dbUser').visible().click().type("[ctrl]a[ctrl-up]\b").type("root").val("root")
		S('#wizard-1 .wiz-content #dbPword').visible().click().type("[ctrl]a[ctrl-up]\b").type("root").val("root")
		S('#wizard-1 .wiz-content #dbPathMySQL').visible().click().type("[ctrl]a[ctrl-up]\b").type("/Applications/MAMP/Library/bin/mysql").val("/Applications/MAMP/Library/bin/mysql")
		S('#wizard-1 .wiz-content #dbPathMySQLDump').visible().click().type("[ctrl]a[ctrl-up]\b").type("/Applications/MAMP/Library/bin/mysqldump").val("/Applications/MAMP/Library/bin/mysqldump")

		S('#wizard-1 .wiz-content #dbPath').visible().click().type("[ctrl]a[ctrl-up]\b").type("localhost").val("localhost")
		S('#wizard-1 .wiz-content #dbPort').visible().click().type("[ctrl]a[ctrl-up]\b").type("3306").val("3306")

		ok(S('#wizard-1 .wiz-nav #next').visible().click())

		//wizard page 2
		ok(S('#wizard-2 .wiz-nav #next').visible().click())

		//wizard page 3
		S('#wizard-3 .wiz-content #emailHost').visible().click().type("[ctrl]a[ctrl-up]\b").type("securemail.example.com").val("securemail.example.com")
		S('#wizard-3 .wiz-content #emailPort').visible().click().type("[ctrl]a[ctrl-up]\b").type("25").val("25")
		S('#wizard-3 .wiz-content #emailDomain').visible().click().type("[ctrl]a[ctrl-up]\b").type("localhost").val("localhost")
	
		ok(S('#wizard-3 .wiz-nav #next').visible().click())
		
		//wizard page 4
		S('#wizard-4 .wiz-content .col1 [key="ko"]').visible().click()
		S('#wizard-4 .wiz-content .col1 [key="de"]').visible().type("[ctrl][escape]").click()
		S('#wizard-4 .wiz-content .col1 button').visible().click()

		ok(S('#wizard-4 .wiz-nav #next').visible().click())

		//wizard page 5
		S('#wizard-5 .wiz-content #siteURL').visible().click().type("[ctrl]a[ctrl-up]\b").type("localhost").val("localhost")
		S('#wizard-5 .wiz-content #sitePort').visible().click().type("[ctrl]a[ctrl-up]\b").type("8088").val("8088")
		
		S('#wizard-5 .wiz-content #adminUserID').visible().click().type("[ctrl]a[ctrl-up]\b").type("root").val("root")
		S('#wizard-5 .wiz-content #adminPWord').visible().click().type("[ctrl]a[ctrl-up]\b").type("root").val("root")
		
		ok(S('#wizard-5 .wiz-nav #next').visible().click())
		
		//wizard page 6
		ok(S('#wizard-6 .wiz-nav #done').visible().click())

	});

})