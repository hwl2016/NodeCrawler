// 初始化casper
var casper = require('casper').create({
	verbose: true,
    logLevel: 'error',
    waitTimeout: 15000,
	pageSettings: {
    	// 冒充浏览器
    	// 'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		// 'acceptEncoding':'gzip, deflate, sdch',
		// 'acceptLanguage':'zh-CN,zh;q=0.8',
		// 'cacheControl':'max-age=0',
		// 'connection':'keep-alive',
		// 'cookie':'PHPSESSID=me7a4utrj7mjb9p2nt57r6od01; smidV2=20170801202524ef35e44e1799b7ab0e370238d0b5ebf119368191ac20b7830; _dys_lastPageCode=page_studio_normal,page_studio_normal; acf_did=F331F62A26872BDD257E9E8035A3AE93; Hm_lvt_e99aee90ec1b2106afe7ec3b199020a7=1500345830,1500432187,1500950328,1501040999; Hm_lpvt_e99aee90ec1b2106afe7ec3b199020a7=1501593203; _dys_refer_action_code=show_title_rank',
		// 'host':'www.douyu.com',
		// 'upgradeInsecure-Requests':1,
        'loadImages':  false,
		'userAgent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
	},
    // 浏览器窗口大小
    viewportSize: {
        width: 320,
        height: 568
    },
    exitOnError: false,
    silentErrors: true,
    onError: function (e) {
        console.log(e);
    },
    clientScripts: [
		"./public/javascripts/jQuery-2.1.4.min.js"
    ]
});

// phantom.outputEncoding="gbk";

var __clientutils__ = require('clientutils').create();
var __utils__ = require('utils');

// var url = 'https://union-click.jd.com/jdc?d=GpEvtJ';
var url = casper.cli.get(0);    // 通过命令行来接受参数

var jumpLink = false;
var sku = '';

casper.start(url, function() {
    var imgUrl, shopName;
    var obj = {};

	if (this.exists('img#spec-img')) {
		imgUrl = this.getElementsAttribute('img#spec-img', 'src');
        if(imgUrl.indexOf('http') == -1) {
            var protocal = url.split(':')[0];
            imgUrl = protocal + ':' + imgUrl;
        }

        if(this.exists('ul.p-parameter-list')) {
            // shopName = this.getHTML('ul.p-parameter-list li');
            shopName = this.evaluate(getShopName).replace(/\s/g, "");
        }

        this.echo(imgUrl + '|' + shopName + '|');
    }else if(this.exists('.skuWrap .layer a')) {
        // this.echo('jump link|' + this.evaluate(getQuery, 'sku') + '|');
        this.mouse.click('.skuWrap .layer a');
        jumpLink = true;
        sku = this.evaluate(getQuery, 'sku');
        this.wait(200);
    }else {
    	this.echo('failed: img#spec-img not exists');
    }
});

casper.then(function() {
    if(jumpLink) {
        if (this.exists('img#spec-img')) {
            imgUrl = this.getElementsAttribute('img#spec-img', 'src');
            if(imgUrl.indexOf('http') == -1) {
                var protocal = url.split(':')[0];
                imgUrl = protocal + ':' + imgUrl;
            }

            if(this.exists('ul.p-parameter-list')) {
                // shopName = this.getHTML('ul.p-parameter-list li');
                shopName = this.evaluate(getShopName).replace(/\s/g, "");
            }

            this.echo(imgUrl + '|' + shopName + '|jumpLink|' + sku + '|');
        }else {
            this.echo('failed: img#spec-img not exists by jumpLink');
        }
    }
    // this.capture('haha' + Math.random() + '.png');
});

function getShopName() {
    return $('ul.p-parameter-list li').eq(3).children('a').text().trim();
}

function getPageUrl() {
    return window.location.href;
}

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

casper.run();