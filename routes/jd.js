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
	var cmd = `casperjs casper/jdImg.js ${url}`;

	child_process.exec(cmd, function(err, stdout, stderr) {
		logger.info('================================');
		logger.info(`京东抓取图片=====执行命令：${cmd}`);

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
});

// 京东抢券
router.post('/tickets', function(req, res, next) {
    var url = req.body.crawlerUrl;
    var username = req.body.username;
    var password = req.body.password;

    // 设置代理服务器
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

    var cmd = `casperjs ${phantomParams} casper/jdTickets.js ${url} ${username} ${password}`;

    child_process.exec(cmd, function(err, stdout, stderr) {
        logger.info('================================');
        logger.info(`代理服务器信息:::::::: ${JSON.stringify(b)}`);
        logger.info(`抢京东优惠券=====执行命令：${cmd}`);

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
				// 获取验证码路径
                var yzm = r[1].slice(4);

                response = {
                    code: 200,
                    msg: 'success',
					data: {
                    	yzm: yzm
					}
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

})

function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
};

module.exports = router;
