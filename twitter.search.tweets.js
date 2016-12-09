var fs = require('fs');
var Twitter = require('twitter');
var json2xls = require('json2xls');

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
  // call tweets with a certain keyword
  t.get('search/tweets', params, function(error, tweets, response) {
    console.log(tweets);
    if (tweets.errors && tweets.errors.length > 0) {
      console.error('Something went wrong: ', tweets.errors.length === 1 ? tweets.errors[0] : tweets.errors);
      return;
    }

    console.log('Retrieved ' + tweets.statuses.length + ' Tweets')
    // checks if this is the first call or the n-th call
    // if this is for example the second call ommit the first tweet
    // this prevents duplicate tweets
    for(var i = (max_id == null) ? 0 : 1; i < tweets.statuses.length; i++){
      // temporary save the returned tweets in an array
      // one option is to push every single tweet in an array (as we are doing now)
      // the advantage of this is that you can format the tweet e.g., remove elements
      // another option is to completely push the tweets array into the allTweets array
      allTweets.push(tweets.statuses[i]);
    }

    // get the max_id from the search_metadata.next_results
    var next_results;
    var max_id;
    if (tweets.search_metadata.search_metadata) {
      next_results = tweets.search_metadata.next_results.replace('?', '').split('&');
      max_id = next_results[0].replace('max_id=', '');
    }

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

if (process.argv.length !== 3) {
  console.error('Please provide a screenname to scrape like `node twitter.get.tweets.js yourName`');
} else {
  var q = process.argv[2];

  // set of parameters
  var params = {
    q: q, // screenname to scrape taken from the CLI input
    count: 100 // amount of tweets. 200 is the max
  };

  // call the function
  searchTweets(params);
}
