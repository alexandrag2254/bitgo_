// Bitgo API interface to parse through html page and transfers funds to student's address depending on whether certain name exists on page

var BitGo = require('bitgo');
var bitgo = new BitGo.BitGo({ env: 'prod', accessToken: '17ec0eb485ddebd36ada6d9926e48cfe7755f0d1a44222fa4f7f8cb53b86b035'});

function firstFunction(_callback){
    
    bitgo.ping({}, function(err,res){ console.dir(res); });
    bitgo.session({}, function(err,res){console.dir(res); });


    setTimeout(Delay, 600);

    function Delay() {
      bitgo.wallets().createWalletWithKeychains({passphrase: 'changeme', label: 'apiwallet'},function(err, res){ console.dir(err); wallet = res.wallet;});

      setTimeout(Delay2, 6000);
      function Delay2(){
        var wallet;
        _callback();
      }
    }

}

function secondFunction(){

    // first function runs when it has completed
    firstFunction(function() {

      console.log("wallet", wallet);

       wallet.createAddress({ "chain": 0 }, function callback(err, address) {console.dir(address);});

       var rule = { id: "webhookRule1",type: "webhook",action: { type: "deny" },condition: { "url": 'https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management' }};


        wallet.setPolicyRule(rule, function callback(err, w) { console.dir(w); });


        //code for the remote endpoint

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
         x = request.get(url, function (error, response, body) {
           if (!error && response.statusCode == 200) {

             var Data = JSON.parse(response.body);
             console.dir(Data.results);
             var name = '';
             var outcome;
             var address;

             Data.results.forEach(function(result) {

               if (result.name == "Banyard") {
                  name = result.value;
                  outcome = "name exists";
                  address = result.value;
               } else{
                outcome = "name does not exist";
               }
             });

             console.log('name: ' + name);
             console.log('result: ' + outcome);

             if (theOutput === address && outcome == "name exists") {
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

    });  


}

// function thirdFunction(){

//     secondFunction(function(){
//       console.log('huzzah, done with first function!');



<<<<<<< HEAD
        //       wallet.createAddress({ "chain": 0 }, function callback(err, address) {console.dir(address);});
=======
//-------***  wallet is undefined at this point  ****--------------//
//asynchronous -- how to run this code to avoid having wallet being undefined
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4


        // //setting policy rule

<<<<<<< HEAD
        // var rule = { id: "webhookRule1",type: "webhook",action: { type: "deny" },condition: { "url": 'https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management' }};


        // wallet.setPolicyRule(rule, function callback(err, w) { console.dir(w); });
=======
//what is chain? 
wallet.createAddress({ "chain": 0 }, function callback(err, address) {
    console.dir(address);
});


//setting policy rule -------
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4


<<<<<<< HEAD
        // //code for the remote endpoint

        // app.post('/name', function(req, res, next) {

        //  var webhookData = req.body;

        //  var theOutput;

        //  webhookData.outputs.forEach(function(output) {
        //    if (output.outputWallet !== webhookData.walletId) {
        //     theOutput = output.outputAddress; 
        //   }
=======
wallet.setPolicyRule(rule, function callback(err, w) { console.dir(w); });

//--------------------------

//code for the remote endpoint
//how to pull specific information from html page? and what part of the code stipulates this? (in the rule variable?)
app.post('/name', function(req, res, next) {
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4

        //  });


        // //url that we will be getting relevant data
        //  var url = "https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management";

        //  var request = require('request');
        //  x = request.get(url, function (error, response, body) {
        //    if (!error && response.statusCode == 200) {

        //      var Data = JSON.parse(response.body);
        //      console.dir(Data.results);
        //      var name = '';
        //      var outcome;
        //      var address;

        //      Data.results.forEach(function(result) {

<<<<<<< HEAD
        //        if (result.name == "Banyard") {
        //           name = result.value;
        //           outcome = "name exists";
        //           address = result.value;
        //        } else{
        //         outcome = "name does not exist";
        //        }
        //      });
=======
 var request = require('request');
 
 //do we need to run x in order to run the request?
 x = request.get(url, function (error, response, body) {
   if (!error && response.statusCode == 200) {
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4

        //      console.log('name: ' + name);
        //      console.log('result: ' + outcome);

        //      if (theOutput === address && outcome == "name exists") {
        //        res.status(200).send({});
        //      } else {
        //        res.status(400).send({});
        //      }
        //    } else {
        //      console.log('error');
        //      console.dir(error);
        //    }
        //  });
        // });

<<<<<<< HEAD
//     });   
    
//     }
=======
       if (result.name == "Banyard") {
          name = result.name;
          outcome = "name exists";
          address = result.value;
       } else{
        outcome = "name does not exist";
       }
     });
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4

//running the full set of functions
secondFunction();
// thirdFunction();

<<<<<<< HEAD
=======
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



//run request x function;

//module.exports = bitgo;
>>>>>>> 100ff5ea33914249c6bd35b30b114696019c94c4
