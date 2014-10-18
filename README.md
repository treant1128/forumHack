forumHack
=========

公司强制要求员工参与论坛互动  互动次数不够要扣部门KPI  俺们都是被逼的


1.  解析HTML标签   提取出每个版块  每个帖子的有用信息   
2.  Chrome开发者模式Network标签   选中一次Post请求  Sava as curl  主要是获取Cookie信息
3.  每个版块fork一个子进程  最后把所有任务汇总给父进程   由父进程发送请求 (为了模拟延时回帖   强者sleep了)
3.  根据Cookie信息  版块 帖子等属性  按照回帖的curl格式构造curl请求  调用excute相关命令  模拟操作系统命令行请求(其实可以直接用node自己的相关http module构造请求参数, 有Chrome生成的curl干嘛不用??)
5.  回帖内容为预定好的一些中性的话语(回复内容不能一样)  可以设置回复版块   回帖页数    回帖间隔(不能刷屏回复  隔一个回复一下)
    两次回帖间隔时间(随机的Min ~ Max时间   不能回复太快  )  
curl "https://d3oaxc4q5k2d6q.cloudfront.net/m/7aaf1677069c/amd/build/repo/index.js.map" -H "X-Source-Map-Request-From: inspector" -H "Accept-Encoding: gzip,deflate,sdch" -H "Accept-Language: zh-CN,zh;q=0.8,en;q=0.6" -H "User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1715.0 Safari/537.36" -H "Accept: */*" -H "Referer: https://bitbucket.org/psiphon/psiphon-circumvention-system" -H "Connection: keep-alive" --compressed
