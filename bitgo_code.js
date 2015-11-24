// Bitgo API interface to parse through html page and transfers funds to student's address depending on whether certain name exists on page

//*************** ISSUE WITH IMPLEMENTAITON ************************//

//Potentially the asynchronous nature of JS prevents wallet from being created 
// all code below var wallet line 24 is hypothetical code and has not been tested 

//*****************************************************************//


var BitGo = require('bitgo');
var bitgo = new BitGo.BitGo({ env: 'prod', accessToken: '7a53f9e70ae28a3254f685c01a2a958032dd239f9d31113e5e23ff434c131e33'});


bitgo.ping({}, function(err,res){ console.dir(res); });

bitgo.session({}, function(err,res){console.dir(res); });

bitgo.wallets().createWalletWithKeychains({passphrase: 'changeme', label: 'apiwallet'}, 
  function(err, res){ console.dir(err); wallet = res.wallet 
	});


var wallet;

//-------***  wallet is undefined at this point  ****--------------//
//asynchronous -- how to run this code to avoid having wallet being undefined


// Create a New Bitcoin Address

//what is chain? 
wallet.createAddress({ "chain": 0 }, function callback(err, address) {
    console.dir(address);
});


//setting policy rule -------

var rule = {
  id: "webhookRule1",
  type: "webhook",
  action: { type: "deny" },
  condition: { "url": 'https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management' }
};

wallet.setPolicyRule(rule, function callback(err, w) { console.dir(w); });

//--------------------------

//code for the remote endpoint
//how to pull specific information from html page? and what part of the code stipulates this? (in the rule variable?)
app.post('/name', function(req, res, next) {

 var webhookData = req.body;

 var theOutput;

 webhookData.outputs.forEach(function(output) {
   if (output.outputWallet !== webhookData.walletId) {
    theOutput = output.outputAddress; 
	}

 });


//url that we will be getting relevant data
 var url = "https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management";

 var request = require('request');
 
 //do we need to run x in order to run the request?
 x = request.get(url, function (error, response, body) {
   if (!error && response.statusCode == 200) {

     var Data = JSON.parse(response.body);
     console.dir(Data.results);
     var name = '';
     var outcome;
     var address;

     Data.results.forEach(function(result) {

       if (result.name == "Banyard") {
          name = result.name;
          outcome = "name exists";
          address = result.value;
       } else{
        outcome = "name does not exist";
       }
     });

     console.log('name: ' + name);
     console.log('result: ' + outcome);

     if (theOutput === address && outcome == "name exists") {
       res.status(200).send({}); // sending bitcoin transaction or message? 
     } else {
       res.status(400).send({}); // sending bitcoin transaction or message?
     }
   } else {
     console.log('error');
     console.dir(error);
   }
 });
});
