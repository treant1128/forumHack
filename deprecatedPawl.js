//不同前台Web页面就先不用express了
var cheerio = require('cheerio');
var request = require('request');
var exec    = require('child_process').exec;
var async   = require('async');
var fs      = require('fs');
var lazy    = require('lazy');

/////////////////////
var url = 'http://bbs.coolpad.com/forum-1090-1.html';
    url = 'http://bbs.coolpad.com/forum.php';     //Override test url
  
var debug    = true;
/////////////////////////////////////////////////////////
var intervalMin = 30;                      // by seconds
var intervalMax = 60;                      // by seconds
var step = 3;                           //reply step between issues

var pages    = 1;                          //每个forum板块要抓取的总页数    Current Not Used
var comments = [
  '这样都可以啊  好吧... 无语凝噎!! {:4_117:}',
  '多谢楼主分享啊, 受益匪浅... {:4_111:}',
  '楼主熬夜看世界杯了吧... {:4_115:}',
  '第一次看到这样啊! 看来偶Out了... {:4_129:}',
  '楼主加油啊  继续努力..! {:4_126:}',
  '9527 Thanks a lot. Oh~ Yeah!',
  'Coolpad领航4G...  加油ing! {:4_120:}',
  '一入侯门深似海 从此萧郎是路人!',
  'LZSB  这个怎么说呢? 见仁见智吧...',
  'We are like dwarfs sitting on the shoulders of giants.',
  '新版本啊,值得一试噢 {:4_111:}',                                                             
  '体验挺不错的,界面也很漂亮啊{:4_111:}',
  '非常值得试用的一个版本{:4_129:}',
  '猿猴们,你们辛苦了! 再接再励吧... {:4_126:}',
  'Come on baby! Let me  try 一 try agagin !{:4_111:}',
  '期待更好的版本出现. {:4_120:}',
  '9527 楼主再接再励吧, 小弟只能帮你到这里了... {:4_115:}', 
  '这个版本真不错,体验真好!{:4_126:}',
  '世界是你们的，也是我们的，但是归根结底是你们的...',
  '这个版本界面真漂亮啊,超出了我的预期啊!{:4_120:}',
  '好版本,值得一试~~ {:4_111:}',
  '{:4_125:} 酷友社区, 一个你来了就不想走的地方... {:4_125:}',
  'Nothing really matters to me, For the Lich-King ~~',
  '如果你拍得不够好,是因为你靠的不够近. {:4_119:}'
];                                      //My Comments
///////////////////////////////////////////////////////// 

var stream  = fs.createReadStream(__dirname + '/cmdFragment.log');
var cmdFragments = new Array();
lazy(stream)
  .lines
  .forEach(function(line){
    line = line.toString();
    if(line.length > 0 && 
      line.charAt(0) != '#' &&
      line.indexOf('curl') != -1){       //ommit blank line && commented line start with '#'
      cmdFragments.push(line);
    }
  });

stream.on('open', function(){
  console.log('----Start Reading User Command Fragments----');
});

stream.on('error', function(){
  console.log('-----------Reading User Command Fragments Error-------------');
});

var fids = new Array();                 //forum编号
var cookieItems = '';

stream.on('end', function(){
  if(cmdFragments.length > 1){
    console.log('有效命令行数大于1 ...  把没用的先注释掉吧...');
    return;
  }
  var myCMD     = cmdFragments[0];
  cookieItems   = myCMD.substring(myCMD.indexOf('-H'), myCMD.lastIndexOf('message=') + 8);
  var formHash  = myCMD.substring(myCMD.indexOf('formhash=') + 9, myCMD.lastIndexOf('&usesig='));   //用户独有的FormHash验证
  console.log('------------CookieItems---------------');
  console.log(cookieItems);
  console.log('-------------FormHash---------------');
  console.log(formHash);
  console.log('***********User Command Fragment**************');
  console.log(cmdFragments.join());

//return;

 
request(url, function(err, response, body){
  if(!err && response.statusCode === 200){
    var $ = cheerio.load(body);
    $('dt a').each(function(i, e){
      console.log(i + ' ### ' + $(e).attr('href'));
      var href = $(e).attr('href');
      href = href.substring(href.indexOf('-') + 1, href.lastIndexOf('-'));
      fids.push(href);
      
    });
    
    if(debug){
      fids = new Array();           //这里清空了获取到的板块的数组fid
      //if debug == true --> 如果是Debug 就暂时不要去搞全部版块

      fids.push('1067');          //酷派领航4G
      fids.push('1097');          //活动专区
      fids.push('1059');          //手机讨论区
 
      fids.push('1090');          //CoolUI设计
//      fids.push('1099');          //应用下载
      fids.push('1065');          //F1
      fids.push('1110');          //Note

//        fids.push('938');           //酷云
        fids.push('1102');          //酷友茶馆
//        fids.push('1063');          //大神(9976A)
    }


    console.log('============fids===========');
    console.log(fids.join('|'));

    //
    //不能回复太快  需要加入定时任务调度功能  否则太假
    if(formHash.length == 0 || formHash == ''){
      console.log('Please configure the right form-hash... OK?');
      return;
    } 
    //
    var commands = new Array();
    var fidCount = 0;
    async.whilst(
        function(){return fidCount < fids.length; },
        function(callbackFid){
          //Only page 1, another whilst needed for page cycle worked...
          doRequest(fidCount, 2, function(cmds){
            for(cmd in cmds){
              console.log(' --- ' + cmds[cmd].substring(60, 82) + ' ****************');
            }
            commands = commands.concat(cmds);        //调用concat后要赋给返回值
            callbackFid();
            fidCount++;
          });
        },
        function(err){
          if(!err){
            console.log('All Commands------->: ' + commands.length);
            var postFix = '';

            for(i in commands){
                postFix = '&posttime='  + new Date().getTime() +
                '&formhash=' + formHash +'&usesig=1&subject=++" --compressed';

                console.log(i + ' ===>>> ' + new Date().toString() + '   ' + commands[i] + postFix);

                treant(commands[i] + postFix, function(outcome){
                  console.log(outcome);
                });
            
                sleep(1000 * (rollTime(intervalMin, intervalMax)));
            }
          }
        }
    );
  }
}); 

});

function doRequest(fff, ppp, callback){
  request('http://bbs.coolpad.com/forum-' + fids[fff] + '-' + ppp + '.html', function(err, response, body){
      if(!err && response.statusCode === 200){
        var cmds = new Array();
        var $ = cheerio.load(body);
        $('tbody').each(function(i, e){


          if(i % step == 0 && $(e).attr('id') != null){       //the first tbody element is not valid which has no id attribute 
            var id = $(e).attr('id');
//            console.log(fids[fff] + '|' + id.substr(id.lastIndexOf('_') + 1));
            
            var cmd = 'curl "http://bbs.coolpad.com/forum.php?mod=post&action=reply&fid=' + fids[fff]
                      + '&tid=' + id.substr(id.lastIndexOf('_') + 1) +
            '&extra=page"%"3D1&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1" ' +
            cookieItems + 
//      '-H "Cookie: oYME_2132_saltkey=K2Sas2cs; oYME_2132_lastvisit=1403920229; oYME_2132_cyid=7318770; oYME_2132_cyno=18991163162; oYME_2132_cysession=be578eac2d5242c3b8e0a7d7968e880dltmntau7n5f0seh74kjdhfwh0kg1hwd2; oYME_2132_cybindphonenum=18991163162; oYME_2132_auth=5531K7zuw7D62upunjEmMACWJHXI"%"2B1u4"%"2BQbkDz6NdbiiA30oICiHHkIqmMfbr"%"2FXyZuqduABAHhzP"%"2BtOPoTOePl717RoP; oYME_2132_lip=61.141.236.19"%"2C1403923847; oYME_2132_security_cookiereport=12924Ecyh"%"2BFbYcX5nXu3BqIyGhbm0h2WuriZiO7ABYfaRR3wOm25; oYME_2132_nofavfid=1; oYME_2132_atarget=1; oYME_2132_st_t=3514964"%"7C1403924578"%"7C1de1fbc39fabaa71ac6a6da9e755c321; oYME_2132_forum_lastvisit=D_1090_1403924333D_1065_1403924578; oYME_2132_ignore_notice=1; oYME_2132_home_diymode=1; oYME_2132_ulastactivity=1403926259"%"7C0; oYME_2132_st_p=3514964"%"7C1403926742"%"7C401176cf3409783b2ec1794ad8c2fcb0; oYME_2132_visitedfid=1090D1065; oYME_2132_viewid=tid_2684039; oYME_2132_lastcheckfeed=3514964"%"7C1403926744; oYME_2132_checkfollow=1; oYME_2132_checkpm=1; Hm_lvt_519b9dfdb2cec4e6976825a44673072f=1401847082,1403698543; Hm_lpvt_519b9dfdb2cec4e6976825a44673072f=1403926744; oYME_2132_smile=1D1; oYME_2132_sendmail=1; oYME_2132_noticeTitle=1; oYME_2132_lastact=1403926766"%"09forum.php"%"09ajax; oYME_2132_connect_is_bind=0" -H "Origin: http://bbs.coolpad.com" -H "Accept-Encoding: gzip,deflate,sdch" -H "Accept-Language: zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4" -H "User-Agent: Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Cache-Control: max-age=0" -H "Referer: http://bbs.coolpad.com/thread-2684039-1-1.html" -H "Connection: keep-alive" --data "message=' + 
            encodeURIComponent(comments[Math.ceil(Math.random() * 100) % comments.length]);

            cmds.push(cmd);
          }
        });

            callback(cmds);
      }else{    //responseCode == 200   OKOK
        console.log('Reqeust Error...');
      }
   });
}


function sleep(sleepTime){
  for(var start = Date.now(); Date.now() - start <= sleepTime;){ }
}

function rollTime(intervalMin, intervalMax){
   return intervalMin + Math.ceil(Math.random() * (intervalMax - intervalMin));
}

function treant(cmd, callback){
   exec(cmd, function(error, stdout, stderr){
     if(!error){
       console.log('*********OK OK OK***********------>  ' + new Date().toString());
       console.log(stdout);
callback(stdout);
     }else{
       console.log('--------------Error----------------');
     //  console.log(error.toString());
     }
   });
}

return;
return;

