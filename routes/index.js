var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Node Crawler 小程序' });
});

// test相关 Page
router.get('/test', function(req, res, next) {
	res.render('test', { title: '功能测试' });
});

// 京东抓图片 Page
router.get('/jd', function(req, res, next) {
	res.render('jd', { title: '京东抓图' });
});

// 114 预约挂号 Page
router.get('/guahao', function(req, res, next) {
	res.render('guahao', { title: '114预约挂号' });
});

module.exports = router;
