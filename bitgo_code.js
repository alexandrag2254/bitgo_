// Bitgo API interface to parse through html page and transfers funds to student's address depending on whether certain name exists on page

//*************** ISSUE WITH IMPLEMENTAITON ************************//

//Potentially the assynchronous nature of JS prevents wallet from being created 
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


// // Create a New Bitcoin Address
wallet.createAddress({ "chain": 0 }, function callback(err, address) {
    console.dir(address);
});


//oracle

app.post('/names', function(req, res, next) {

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
 x = request.get(url, function (error, response, body) {
   if (!error && response.statusCode == 200) {

     var Data = JSON.parse(response.body);
     console.dir(Data.results);
     var name = '';
     var result;
     var address;

     Data.results.forEach(function(result) {

       if (result.name == "Banyard") {
          name = result.value;
          result = "name exists";
          address = result.value;
       } else{
        result = "name does not exist";
       }
     });

     console.log('name: ' + name);
     console.log('result: ' + result);

     if (theOutput === address && result == "name exists") {
       res.status(200).send({});
     } else {
       res.status(400).send({});
     }
   } else {
     console.log('error');
     console.dir(error);
   }
 });
});
