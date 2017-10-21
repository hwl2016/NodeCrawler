// var __clientutils__ = require('clientutils').create();
// var __utils__ = require('utils');

// 初始化casperjs
var casper = require('casper').create({
	verbose: true,
    logLevel: 'error',
    waitTimeout: 20000,
	pageSettings: {
        // 'loadImages':  false,
		'userAgent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
	},
    // 浏览器窗口大小
    viewportSize: {
        width: 375,
        height: 667
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

var url = casper.cli.get(0);    // 要抢的京东链接
var username = casper.cli.get(1);    // 用户手机账号
var password = casper.cli.get(2);    // 京东密码

var baseUrl = 'http://10.4.72.82:3001/';

// 打开页面 并登陆
casper.start(url)

casper.waitForUrl(/login\.action/, function() {
    this.evaluate(function(a, b) {
        $('#username').val(a);  // 填写用户名
        $('#password').val(b);  // 填写密码
        $('#loginBtn').addClass('btn-active');  // 将登陆按钮置成可以点击的状态
    }, username, password);
    this.wait(200);
});

casper.then(function() {
    this.mouse.click('#loginBtn')   // 点击登陆按钮
    this.wait(10000);

    // 等待进入领取优惠券的页面
    // this.waitForUrl(/show\.action/, function() {
    //     this.echo('success|')
    //     this.capture('download/jd/' + (+new Date()) + '.png');
    // });
});

casper.then(function() {
    if(this.exists('#validateCode')) {
        /*var yzm = 'yzm_' + (+new Date()) + '.jpg';
        var saveTo = 'download/yzmImg/' + yzm;

        // 只截取验证码
        this.capture(saveTo, {
            top: 210,
            left: 260,
            width: 107,
            height: 42
        });

        var yzmUrl = baseUrl + saveTo;  // 识别图形验证码

        this.echo('success|yzm:' + yzmUrl + '|');*/

        var yzmBase64 = this.captureBase64('png', {
            top: 210,
            left: 260,
            width: 107,
            height: 42
        })

        this.echo('success|yzm:' + yzmBase64 + '|');

        // 填写验证码
        // this.evaluate(function(code) {
        //     $('#validateCode').val(code);
        // }, code);
        // this.mouse.click('#btnSubmit');  // 点击领取按钮
    }else {
        this.echo('failed|未进入到领券页面|');
    }
});

casper.run();

function getQuery(key, url) {
    var url = url || window.location.href + '';
    if (url.indexOf('#') !== -1)
        url = url.substring(0, url.indexOf('#'));
    var rts = [], rt;
    var queryReg = new RegExp('(^|\\?|&)' + key + '=([^&]*)(?=&|#|$)', 'g');
    while (( rt = queryReg.exec(url) ) != null) {
        rts.push(decodeURIComponent(rt[ 2 ]));
    }
    if (rts.length == 0) return null;
    if (rts.length == 1) return rts[ 0 ];
    return rts;
}
