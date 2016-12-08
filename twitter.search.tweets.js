var Twitter = require('twitter');
var fs = require('fs');
var json2xls = require('json2xls');
var qs = require('querystring');

var t = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: '',
});

// array containing all the specific tweets
var allTweets = [];

// variables used to keep traverse the timeline
var max_id = null;
var prev_max_id = null;

// function to get Tweets of a specific user
function searchTweets(params){
  // call statuses/user_timeline
  t.get('search/tweets', params, function(error, tweets, response) {

    console.log('Retrieved ' + tweets.statuses.length + ' Tweets')
    // checks if this is the first call or the n-th call
    // if this is for example the second call ommit the first tweet
    // this prevents duplicate tweets
    for(i = (max_id == null) ? 0:1; i<tweets.statuses.length; i++){
      // temporary save the returned tweets in an array
      // one option is to push every single tweet in an array (as we are doing now)
      // the advantage of this is that you can format the tweet e.g., remove elements
      // another option is to completely push the tweets array into the allTweets array
      allTweets.push(tweets.statuses[i]);
    }

    // get the max_id from the search_metadata.next_results
    var next_results = tweets.search_metadata.next_results.replace('?', '').split('&');
    var max_id = next_results[0].replace('max_id=', '');

    // check if max_id is set and check prev_max_id is different from max_id
    // this prevents the script to run forever
    if(max_id != null && max_id != prev_max_id){
      // set the prev_max_id
      prev_max_id = max_id;

      // create new set of parameters
      var params = {q: q, count: count, max_id: max_id};

      // call this function again with
      // wait 6 seconds to stay within the api call rate
      // this could be done better
      setTimeout(function() {
        searchTweets(params);
      }, 6000);

    } else {
      // there are no more tweets to collect
      // use json2xls lin to create Excel object
      var xls = json2xls(allTweets);

      // create filename
      var file = 'search.xlsx';

      // write results to file
      fs.writeFileSync(file, xls, 'binary');

      // inform the user that the task is done
      console.log('Done collecting tweets. Saving results to Excel file');
    }
  });
}

// screename to scrape taken from the CLI input
var q = process.argv[2];

// amount of tweets. 100 is the max
var count = 100;

// set of parameters
var params = {q: q, count: count};

// call the function
searchTweets(params);
