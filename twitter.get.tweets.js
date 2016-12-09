var Twitter = require('twitter');
var fs = require('fs');
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
function getTweets(params){
  // call statuses/user_timeline
  t.get('statuses/user_timeline', params, function(error, tweets, response) {

    console.log('Retrieved ' + tweets.length + ' Tweets')
    // checks if this is the first call or the n-th call
    // if this is for example the second call ommit the first tweet
    // this prevents duplicate tweets
    for(i = (max_id == null) ? 0:1; i<tweets.length; i++){
      // temporary save the returned tweets in an array
      // one option is to push every single tweet in an array (as we are doing now)
      // the advantage of this is that you can format the tweet e.g., remove elements
      // another option is to completely push the tweets array into the allTweets array
      allTweets.push(tweets[i]);
    }

    // get the id of the last tweet
    if(tweets.length > 0){
      max_id = tweets[tweets.length-1].id;

      // check if max_id is set and check prev_max_id is different from max_id
      // this prevents the script to run forever
      if(max_id != null && max_id != prev_max_id){
        // set the prev_max_id
        prev_max_id = max_id;

        // create new set of parameters
        params.max_id = max_id;

        // call this function again with
        // wait 2 seconds to stay within the api call rate
        // this could be done better
        setTimeout(function() {
          getTweets(params);
        }, 2000);
      }
    } else {
      // there are no more tweets to collect
      // use json2xls to create Excel object
      var xls = json2xls(allTweets);

      // create a datetime stamp to include to the filename
      var now = new Date().getTime();
      now += (60*60*1000);
      now = new Date(now);
      now = now.toISOString().replace('T', '@').substr(0, 19).replace(/:/g,"_");

      // create filename ... needs datetime
      var file = screen_name + '_' + dt + '.xlsx';

      // write results to file
      fs.writeFileSync(file, xls, 'binary');

      // inform the user that the task is done
      console.log('Done collecting tweets. Saving results to ' + file);
    }
  });
}

// screename to scrape taken from the CLI input
var screen_name = process.argv[2];

// amount of tweets. 200 is the max
var count = 200;

// set of parameters
var params = {screen_name: screen_name, count: count, trim_user: true};

// call the function
getTweets(params);
