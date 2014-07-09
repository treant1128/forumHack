//不同前台Web页面就先不用express了
var cheerio = require('cheerio');
var request = require('request');
var exec    = require('child_process').exec;
var async   = require('async');
var fs      = require('fs');
var lazy    = require('lazy');
var cp      = require('child_process');
var path    = require('path');

/////////////////////
var url = 'http://bbs.coolpad.com/forum-1090-1.html';
    url = 'http://bbs.coolpad.com/forum.php';     //Override test url
var part1 = 'curl "http://bbs.coolpad.com/forum.php?mod=post&action=reply&fid=';
var part2 = '&extra=page"%"3D1&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1" ';
var formHash = '';               //随机的用户Form Hash认证

var debug    = true;
/////////////////////////////////////////////////////////
var intervalMin = 30;                      // by seconds
var intervalMax = 60;                      // by seconds

var step = 5;                           //reply step between timelines

var pageStart    = 1;                          //每个板块起始页
var pageEnd      = 4;                          //结束页
var comments = [
  '这样都可以啊  好吧... 无语凝噎!! {:4_117:}',
  '多谢楼主分享啊, 受益匪浅... {:4_111:}',
  '楼主熬夜看世界杯了吧... 222 {:4_115:}',
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
  '这个版本不错,体验真好!{:4_126:}',
  '世界是你们的，也是我们的，但是归根结底是你们的...',
  '这个版本界面真漂亮啊,超出了我的预期啊!{:4_120:}',
  '好版本,值得一试~~ {:4_111:}',
  '{:4_125:} 酷友社区, 一个你来了就不想走的地方... {:4_125:}',
  'Nothing really matters to me, For the Lich-King ~~',
  '如果你拍得不够好,是因为你靠的不够近. {:4_119:}',
  '各位酷友可以通过酷派众多4G智能终端新品随时随地尽享掌上FIFA的极速和畅快！'
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

var fids = new Array();                 //forum编号
var cookieItems = '';

stream.on('end', function(){
  if(cmdFragments.length > 1){
    console.log('有效命令行数大于1 ...  把没用的先注释掉吧...');
    return;
  }

  var myCMD     = cmdFragments[0];
  cookieItems   = myCMD.substring(myCMD.indexOf('-H'), myCMD.lastIndexOf('message=') + 8);
  formHash  = myCMD.substring(myCMD.indexOf('formhash=') + 9, myCMD.lastIndexOf('&usesig=')); 
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
    
      //if debug == true --> 如果是Debug 就暂时不要去搞全部版块
    if(debug){
      fids = new Array();           //这里清空了获取到的板块的数组fid
//      fids.push('1067');          //酷派领航4G
//      fids.push('1097');          //活动专区
      fids.push('1059');          //手机讨论区
 
      fids.push('1090');          //CoolUI设计
//      fids.push('1099');          //应用下载
//      fids.push('1065');          //F1
      fids.push('1110');          //Note

//        fids.push('938');           //酷云
//        fids.push('1102');          //酷友茶馆
      fids.push('1063');          //大神(9976A)
    }

    console.log('============fids===========');
    console.log(fids.join('|'));
    //
    //不能回复太快  需要加入定时任务调度功能  否则太假
    if(formHash.length == 0 || formHash == ''){
      console.log('Please configure the right form-hash... OK?');
      return;
    } 

  if(pageStart > pageEnd){
    console.log('Start page is large then End page!');
    return;
  }
    //
    var CHILD_COUNT = (pageEnd - pageStart + 1) * fids.length;
  console.log('Your Need to fork %d processes. Wating Plz!', CHILD_COUNT);

  var tasks = new Array(CHILD_COUNT);
  var subResponse = new Array();  
  var allCMDs = new Array();

//fork first, then listen on message event
  async.waterfall([
    function(cb){
      var count = 0;
      for(var i=0; i<fids.length; i++){
        for(var j=pageStart; j<=pageEnd; j++){
          tasks[count] = cp.fork(__dirname + path.sep + 'sub.js');
          tasks[count].send({fid : fids[i], page : j, step : step});
          count++;
        }
      }
      cb(null, 'Fork Over!');
    },
    function(no, cb){
      for(var k=0; k<CHILD_COUNT; k++){
        tasks[k].on('message', function(m){
        console.log('PARENT got message: ' + JSON.stringify(m));
        subResponse = subResponse.concat(m);

        console.log('^^^^Now parent has received %d messages', subResponse.length);

          if(subResponse.length === CHILD_COUNT){
            console.log('All Child Work OK ~~~~~~');
            for(rr in subResponse){
              allCMDs = allCMDs.concat(subResponse[rr].subResult);
            }
            console.log('%%%%%%%%%%%%%%% Total CMD is : ' + allCMDs.length);
            cb(null, allCMDs);
          }
        });
      }
    }], function(err, result){
      if(!err){
        executeMission(result);
      }
    });
}
});
});

function executeMission(allCMDs){
  var executeCMD = '';
  for(cc in allCMDs){
    executeCMD = part1 + 
            allCMDs[cc] + 
            part2 + 
            cookieItems + 
            encodeURIComponent(comments[Math.ceil(Math.random() * 100) % comments.length]) + 
            '&posttime='  + new Date().getTime() +
            '&formhash=' + formHash +'&usesig=1&subject=++" --compressed';

    console.log(cc + ' ---> ' + new Date().toString() + ' ---->> ' + executeCMD);
    
    treant(executeCMD, function(result){
      console.log(result.toString());
    });

    console.log('Are You going to sleep????????????????\n');
//setInterval(function(){console.log('Sleep ==========Sleep' + executeCMD);}, 2000);
        
    sleepBySeconds(rollTimeBySeconds(intervalMin, intervalMax));
  }
}

function sleepBySeconds(sleepTime){
  for(var start = Date.now(); Date.now() - start <= 1000 * sleepTime;){ 
  // do nothing
  }
}

function rollTimeBySeconds(intervalMin, intervalMax){
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
       console.log(error.toString());
     }
   });
}
