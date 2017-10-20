var request = require('request');
var syncRequest = require('sync-request');
var path = require('path');
var fs = require('fs');
var async = require('async');
var http = require("http");
var iconv = require("iconv-lite");
var Buffer = require('buffer').Buffer;
var cheerio = require("cheerio");
var crypto = require('crypto');
var express = require('express');
var router = express.Router();
var logger = require('../logger').logger;
const child_process = require("child_process");

// md5 测试
router.post('/md5', function(req, res, next) {
	// sign:3818ea871618affb1237ab1b92365d02
	// ver:2017090801
	// tt:25088297
	// cdn:ws
	// cptl:0002
	// did:F331F62A26872BDD257E9E8035A3AE93
	// rate:0

	var room_id = '223592';
	var did = 'F331F62A26872BDD257E9E8035A3AE93';
	var salt = '223592rBP7aNjLAj';
	var tt = '25088297';
	// var data = md5({$room_id}{$did}A12Svb&%1UUmf@hC{$tt});
	var data = md5(`${room_id}${did}${salt}${tt}`);		// 49d69a623bb214bc9fbddbc5a0095f36

	res.json({
		code: 200,
		data: data
	});

});

// 获取代理
router.post('/proxy/info', function(req, res, next) {
	var proxyURL = 'http://http-webapi.zhimaruanjian.com/getip?num=1&type=2&pro=&city=0&yys=0&port=1&time=1';
	request(proxyURL, function(error, response, body) {
	    if (!error && response.statusCode == 200) {
	    	var d = JSON.parse(body);
	    	logger.info('Proxy ========> ' + body);
	    	res.json({
	    		code: 200,
	    		msg: 'success',
	    		data: d.data[0]
	    	})
	    }else {
	    	res.json({
	    		code: 500,
	    		msg: '代理接口获取失败'
	    	})
	    }
	});
});

// 测试代理服务器
router.post('/proxy/server', function(req, res, next) {
	var target = req.body.target;

	var phantomParams = '';
	var proxyURL = 'http://http-webapi.zhimaruanjian.com/getip?num=1&type=2&pro=&city=0&yys=0&port=1&time=1';
	var d = syncRequest('GET', proxyURL);	// 同步获取代理ip和端口
	var b = null;

	if(d.statusCode == 200) {
		b = JSON.parse(d.body);
		if(b.data && b.data.length > 0) {
			var ip = b.data[0].ip;
			var port = b.data[0].port;
			var phantomParams = `--proxy=${ip}:${port} --proxy-type=http`;
		}
	}

	var cmd = `casperjs ${phantomParams} casper/testProxy.js ${target}`;

	child_process.exec(cmd, function(err, stdout, stderr) {
		logger.info('================================');
		logger.info(`代理服务器信息:::::::: ${JSON.stringify(b)}`);
		logger.info(`执行命令：${cmd}`);

		if(err || stderr) {
			logger.error('ERROR >>>>>>>>>>> node execute err: ' + err);
			logger.error('ERROR >>>>>>>>>>> casper execute stderr: ' + stderr);
			return
		}
		if(stdout) {
			var r = stdout.split('|');
			var response = null;

			if(r[0] == 'success') {
				logger.info(`casper execute stdout: ${stdout}`);
				response = {
					code: 200,
					msg: 'success'
				};
			}else {
				logger.error(`ERROR >>>>>>>>>>> ${stdout}`);
				response = {
					code: 500,
					msg: `${r[1]}`
				};
			}
			res.json(response);
		}else {
			logger.error(`ERROR >>>>>>>>>>>  500!!!  casperjs stdout为空`);
			res.json({
				code: 501,
				msg: 'casperjs的stdout为空'
			});
		}
	});
});

function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
};

module.exports = router;