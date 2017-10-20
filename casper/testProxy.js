// var __clientutils__ = require('clientutils').create();
// var __utils__ = require('utils');

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

var url = casper.cli.get(0);

// 打开页面
casper.start(url);

casper.then(function() {
    this.wait(200);
});

casper.then(function() {
    this.capture('proxy' + Math.random() + '.png');
    this.echo('success|')
});

casper.run();
