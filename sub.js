var request = require('request');
var cheerio = require('cheerio');

process.on('message', function(m){
//  process.send(m);
  var fid = m.fid;
  var page = m.page;
  var step = m.step;

  doRequest(fid, page, step, function(cmds){
           process.send({subResult : cmds}); 
  });
});


function doRequest(fff, ppp, step, callback){
  request('http://bbs.coolpad.com/forum-' + fff + '-' + ppp + '.html', 
    function(err, response, body){
      var cmds = new Array();
      if(!err && response.statusCode === 200){
        var $ = cheerio.load(body);
        $('tbody').each(function(i, e){

//the first tbody element is not valid which has no id attribute 
          if(i % step == 0 && $(e).attr('id') != null){       
            var id = $(e).attr('id');
            if(id.substr(id.lastIndexOf('_') + 1).indexOf('separatorline') === -1){
//            console.log(fids[fff] + '|' + id.substr(id.lastIndexOf('_') + 1));
                var cmd = fff  + '&tid=' + id.substr(id.lastIndexOf('_') + 1);
   //         encodeURIComponent(comments[Math.ceil(Math.random() * 100) % comments.length]);

              console.log('-------- ' + cmd);
              cmds.push(cmd);
            }  // id OK
          }  // skip every step
        });
        callback(cmds);
      }else{    //responseCode == 200   OKOK
        console.log('Reqeust Error...');
        callback(cmds);
      }
   });
} //End of doRequest function


