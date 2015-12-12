var request = require('request');
var cheerio = require('cheerio');

request({
    method: 'GET',
    url: 'https://www.actuaries.org.uk/studying/exam-results/ca1-actuarial-risk-management'
}, function(err, response, body) {
    if (err) return console.error(err);
    // console.log(body);

    // Tell Cherrio to load the HTML
    $ = cheerio.load(body);
    var parsedResults = [];

    $('div.field-body').each(function() {

    	Data = $('p', this).text();
    	console.log(Data);
    	try string to array 
    	// var names = JSON.parse(Data);

    	// names.forEach(function(result) {
    	// 	console.log(result);
    	// });

    	// var metadata = {
     //    rank: parseInt(rank),
     //    title: title,
     //    url: url,
     //    points: parseInt(points),
     //    username: username,
     //    comments: parseInt(comments)
     //  };
      // Push meta-data into parsedResults array
      // parsedResults.push(metadata);

    });

    // Log our finished parse results in the terminal
    // console.log(parsedResults);

});