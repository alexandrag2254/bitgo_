var express = require("express"),
	app = express();

var FitbitApiClient = require("fitbit-node"),
	client = new FitbitApiClient("0a78919e25675ff1e38d3003769fb810", "f29379f1a1cbe22132ec683fc32f6aac");
	//consumer key and then consumer secret 
	//oauth_token=31abcd438f5ef0c9f0b9a04993964c62&oauth_verifier=c56edbe3934bd1929d6148c4138c693e	

var requestTokenSecrets = {};

app.get("/authorize", function (req, res) {
	client.getRequestToken().then(function (results) {
		var token = results[0],
			secret = results[1];
		requestTokenSecrets[token] = secret;
		res.redirect("http://www.fitbit.com/oauth/authorize?oauth_token=" + token);
	}, function (error) {
		res.send(error);
	});
});

app.get("/hello", function (req, res) {
	//your callback url
	var token = req.query.oauth_token,
		secret = requestTokenSecrets[token],
		verifier = req.query.oauth_verifier;
	client.getAccessToken(token, secret, verifier).then(function (results) {
		var accessToken = results[0],
			accessTokenSecret = results[1],
			userId = results[2].encoded_user_id;
		return client.get("/profile.json", accessToken, accessTokenSecret).then(function (results) {
			var response = results[0];
			res.send(response);
		});
	}, function (error) {
		res.send(error);
	});
});

app.listen(8000, function(){
	console.log('listening on port 8000')
});