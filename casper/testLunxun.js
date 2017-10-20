var __clientutils__ = require('clientutils').create();
var __utils__ = require('utils');

// 初始化casperjs
var casper = require('casper').create({
    verbose: true,
    logLevel: 'error',
    waitTimeout: 15000,
    pageSettings: {
        'loadImages':  false,
        'userAgent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
    },
    // 浏览器窗口大小
    viewportSize: {
        width: 1024,
        height: 568
    },
    exitOnError: false,
    silentErrors: true,
    onError: function (e) {
        console.log(e);
    },
    onAlert: function (msg) {//alert的回调函数
        // console.log("onAlert===========================msg:" + msg);
    },
    clientScripts: [
        "./public/javascripts/jQuery-2.1.4.min.js"
    ]
});

// phantom.outputEncoding="gbk";

var url = 'http://www.baidu.com';
var username = '17080312246';

var cnt = 1;    // 轮询手机验证码初始次数
var timer = null;   // 轮询定时器

// 打开页面 并登陆
casper.start(url, function() {
    this.wait(300);
});

// 进入医院的详情页面
casper.then(function() {
    var flag = true;
    var yzm = '';
    while(true) {
        sleep(1000);
        yzm = this.evaluate(getYZM, username);

        if(yzm) {
            this.echo(yzm);
            break;
        }else {
            this.echo('未获取到验证码');
        }
    }

});

function callback(obj, cnt, timer, yzm) {
    obj.echo('cnt: ' + cnt);
    obj.echo('timer: ' + timer);
    obj.echo('yzm: ' + yzm);
}

casper.run();

function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime) {
            break;
        }
    }
}


// 轮询验证码
function lunxun(obj, cb) {
    var yzm = obj.evaluate(getYZM, username);
    if(yzm) {
        cnt = 0;
        timer = null;
        if(typeof cb == 'function') {
            cb(yzm);
        }
    }else if(cnt < 30) {
        cnt ++;
        timer = setTimeout(function() {
            lunxun(obj);
        }, 1000);
    }else {
        cnt = 0;
        timer = null;
    }
}

// 获取手机验证码
function getYZM(phone) {
    var code = '';
    var interTime = 2 * 60 * 1000; // 验证码时间间隔不能超过2min
    $.ajax({
        url: 'http://xlyqq.xilexuan.com/scriptmanager/cardPoolAction.do?method=getSms&phone=' + phone,
        type: 'GET',
        async: false,
        success: function(d) {
            d = typeof d == 'string' ? JSON.parse(d) : d;
            if(d.r == 200) {
                for(var i = 0; i < d.data.length; i ++) {
                    var item = d.data[i];
                    var msg = item.message;
                    if(msg.indexOf('北京市预约挂号统一平台') != -1) {
                        var diffTime = Math.abs(new Date() - item.sendTime)
                        // 验证码时间间隔不能超过2min 否则视为短信没有发出
                        if(diffTime < interTime) {
                            code = msg.slice(-7,-1);
                        }
                        break;
                    }
                }
            }else {
                // code = ''
            }
        },
        error: function() {
            // code = 'ajax error function execute' ;
        }
    })
    return code;
}
