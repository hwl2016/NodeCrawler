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

// const imgDir = path.join(__dirname, '../download/');
const imgDir = 'G:\\Nodejs\\NodeCrawler\\download\\jd\\';
// const imgDir = '/export/xunbaomallPhoto/IBS/SHW/2200699899/';

// 抓取图片 一次抓取一张
router.post('/img', function(req, res, next) {

	var url = req.body.target;

	// if(url.indexOf('http') != 0) {
	// 	res.json({
	// 		code: 500,
	// 		msg: 'url不合法'
	// 	});
	// 	return;
	// }

	var cmd = `casperjs casper/jdImg.js ${url}`;

	child_process.exec(cmd, function(err, stdout, stderr) {
		logger.info('================================');
		logger.info(`执行命令：${cmd}`);

		if(err) {
			logger.error('err: ' + stderr);
			return
		}
		if(stderr) {
			logger.error('stderr: ' + stderr);
			return
		}
		if(stdout) {
			// var buffer = new Buffer(stdout);
			// stdout = iconv.decode(stdout, 'gbk');

			if(stdout.indexOf('failed') != -1) {	// 图片抓取失败
				logger.error(stdout);
				res.json({
					code: 500,
					msg: '传入的链接没有图片'
				});
				return
			}

			logger.info(`stdout: ${stdout}`);
			var data = stdout.split('|');

			var imgUrl = data[0];
			var shopName = data[1];

			var ext = imgUrl.slice(imgUrl.lastIndexOf('.'));
			// logger.info(`图片格式：${ext}`);
			ext = '.jpg';	//强制修改图片格式为jpg
			var imgName = md5(url) + ext;
			// var imgLocalUrl = createDateDir() + imgName;
			var imgLocalUrl = imgDir + imgName;
			// 下载图片
			request(imgUrl).pipe(fs.createWriteStream(imgLocalUrl));

			var response = {
				code: 200,
				msg: 'success',
				data: {
					imgOriginUrl: imgUrl,
					imgLocalUrl: imgLocalUrl,
					shopName: shopName
				}
			};

			if(stdout.indexOf('jumpLink') != -1) {	// 点击查看详情继续获取商品详情
				response.code = 201;
				response.data.jdUrl = 'https://item.jd.com/' + data[data.length - 2] + '.html';
			}

			res.json(response);

		}else {
			res.json({
				code: 500,
				msg: err
			});
		}
	});

	// res.json({
	// 	code: 200,
	// 	msg: 'success'
	// });

});

function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
};

// function createDateDir() {
// 	var logDirectory = imgDir + '/' + createDate();
// 	if(!fs.existsSync(logDirectory)) {
// 		fs.mkdirSync(logDirectory)
// 	}
// 	return logDirectory + '\\';
// }

// function createDate() {
// 	var d = new Date();
// 	var yyyy = d.getFullYear();
// 	var MM = d.getMonth() + 1;
// 	var dd = d.getDate();
// 	MM = MM.toString().length == 1 ? '0' + MM : MM;
// 	dd = dd.toString().length == 1 ? '0' + dd : dd;
// 	return yyyy + MM + dd;
// }

module.exports = router;
