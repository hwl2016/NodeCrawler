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

// 挂号预约
router.post('/guahao', function(req, res, next) {
	var obj = req.body;

	// console.log(obj);
	var url = 'http://www.bjguahao.gov.cn/hp.htm';
	var username = obj.username;
	var password = obj.password;
	var hospitalName = obj.hospitalName;
	var department = obj.department;
	var appointmentTime = obj.appointmentTime;

	var yyInfo = 'jzk:' + obj.jzk + ',ybk:' + obj.ybk + ',bxlx:' + obj.bxlx;

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

	var cmd = `casperjs ${phantomParams} casper/114.js ${url} ${username} ${password} ${hospitalName} ${department} ${appointmentTime} ${yyInfo}`;

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

module.exports = router;
