var async = require('async');

var count = 0;

    async.whilst(
      function(){return count < 10; },
      function(callback){
        console.log('Count: ' + count);
        count++;
        callback();
      },
      function(err){
        console.log('总共ZADD的数量 ');
      }
    ); //End of async.whilst
