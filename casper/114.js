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

// phantom.outputEncoding="gb2312";

var url = casper.cli.get(0);    // 通过命令行来接受参数  抓取的页面url
var username = casper.cli.get(1);    // 通过命令行来接受参数  登陆用户名
var password = casper.cli.get(2);    // 通过命令行来接受参数  登陆密码
var hospitalName = casper.cli.get(3);    // 通过命令行来接受参数  预约的医院
var department = casper.cli.get(4);    // 通过命令行来接受参数    预约的科室
var appointmentTime = casper.cli.get(5);    // 通过命令行来接受参数   预约时间

var yyInfo = casper.cli.get(6);    // 通过命令行来接受参数   预约人相关信息 （就诊卡、医保卡、报销类型等）
// var yyInfo = 'jzk:aaa,ybk:sss,bxlx:5';
var info = yyInfo.split(',');
var jzk = info[0].split(':')[1];
var ybk = info[1].split(':')[1];
var bxlx = parseInt(info[2].split(':')[1]);

// 打开页面 并登陆
casper.start(url, function() {
    this.mouse.click('a#bdtj1');
    this.fill('form#rg_nrfrom1', {  
        'smsQuick': username,  
        'passWordQuick': password
    }, true);
    this.wait(300);
});

// 搜索医院
casper.then(function() {
    this.fill('form[name="search"]', {  
        'words': hospitalName
    }, true); 
    this.wait(300);
});

// 进入医院的详情页面
casper.then(function() {
    if(this.exists('.yiyuan_content_1')) {
        var jumpURL = this.evaluate(getJumpURL, '.yiyuan_content_1 .yiyuan_co_titl a', hospitalName);  // 获取医院详情页面的链接
        if(jumpURL) {
            // 进入科室的详情页面
            this.open(jumpURL).then(function() {
                if(this.exists('.kfyuks_ks_content')) {
                    var jumpURL2 = this.evaluate(getJumpURL, 'a.kfyuks_islogin', department);  // 获取医院详情页面的链接
                    if(jumpURL2) {
                        // 进入预约操作页面
                        this.open(jumpURL2).then(function() {
                            // 进行预约操作
                            // 预约按钮标识： .ksorder_ym : 约满； .ksorder_kyy: 可预约
                            if(this.exists('.ksorder_kyy')) {
                                var kyy = this.evaluate(getAppointmentBtn, appointmentTime);    // 选择预约按钮
                                if(kyy) {   // 有可预约按钮
                                    var ref = this.getCurrentUrl(); // 获取当前url

                                    // 以下方式（主动发ajax  拼接链接跳转）必须设置referer的请求头  挂号平台做了防止黄牛的操作
                                    var jumpToDoctorUrl = this.evaluate(getPartDutyUrl, appointmentTime);

                                    /*if(jumpToDoctorUrl.indexOf('http') != -1) {
                                        // 进入预约医生的页面
                                        this.thenOpen(jumpToDoctorUrl, {
                                            method: 'get',
                                            headers: {
                                                'Upgrade-Insecure-Requests': 1,
                                                'Referer': ref    // 必须设置referer的请求头  很重要！！！
                                            }
                                        }).then(function() {

                                            this.echo('success|href:::'+ jumpToDoctorUrl + '|');
                                            this.capture('download/114/' + (+new Date()) + '.png');
                                            return

                                            // 点击发送验证码
                                            this.mouse.click('#btnSendCodeOrder');

                                            this.waitForAlert(function(response) {    // 等待弹框出现  casperjs会自动将alert弹框关闭

                                                var yzm = '';

                                                while(true) {
                                                    sleep(1000);    // 每隔1秒请求一次验证码
                                                    yzm = this.evaluate(getYZM, username);
                                                    if(yzm) {
                                                        break;
                                                    }
                                                }

                                                // 填写手机验证码等相关信息
                                                if(yzm) {
                                                    this.evaluate(function(jzk, ybk, bxlx, yzm) {
                                                        $('#Rese_db_dl_jzk').val(jzk); // 填写就诊卡
                                                        $('#Rese_db_dl_ybk').val(ybk); // 填写医保卡
                                                        $('.Rese_db_dl_select option').eq(bxlx).get(0).selected = true;    //  选择报销类型
                                                        $('#Rese_db_dl_dxyzid').val(yzm); // 填写手机验证码
                                                    }, jzk, ybk, bxlx, yzm);

                                                    // 点击预约
                                                    this.mouse.click('#Rese_db_qryy_btn');
                                                    this.wait(200);

                                                    this.then(function() {
                                                        this.echo('success|');
                                                        this.capture('download/114/' + (+new Date()) + '.png');
                                                    })
                                                }else {
                                                    this.echo('failed|手机验证码获取失败|');
                                                }

                                            })
                                        })
                                    }else {
                                        this.echo('failed|' + jumpToDoctorUrl + '|');
                                    }*/

                                    // 可能没有 ksorder_dr1_syhy
                                    this.waitForSelector('.ksorder_dr1_syhy', function(){   // 等待"预约挂号"按钮的出现 ksorder_dr1_syhy
                                        var jUrl = this.evaluate(function() {
                                            var link = $('a.ksorder_dr1_syhy').eq(0);
                                            var hh = link.attr('href');
                                            link.click();
                                            return hh;
                                        });

                                        if(jumpToDoctorUrl.indexOf('http') != -1) {

                                            /*Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*!/!*;q=0.8
                                             Accept-Encoding:gzip, deflate, sdch
                                             Accept-Language:zh-CN,zh;q=0.8
                                             Connection:keep-alive
                                             Cookie:SESSION_COOKIE=3cab1829cea361dbceb97f7e; __guid=209865491.3396663288048206300.1508144439143.2546; JSESSIONID=A9EC5A5B007EFE205A3365EAB8FFD351; monitor_count=507; Hm_lvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1508144442; Hm_lpvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1508568942
                                             Host:www.bjguahao.gov.cn
                                             Referer:http://www.bjguahao.gov.cn/dpt/appoint/142-200039544.htm
                                             Upgrade-Insecure-Requests:1
                                             User-Agent:Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36*/

                                            // var cookie = 'SESSION_COOKIE=3cab1829cea361dbceb97f7e; __guid=209865491.3396663288048206300.1508144439143.2546; JSESSIONID=A9EC5A5B007EFE205A3365EAB8FFD351; monitor_count=539; Hm_lvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1508144442; Hm_lpvt_bc7eaca5ef5a22b54dd6ca44a23988fa=' + (+new Date()).toString().slice(0, -3);
                                            // var cookie = this.evaluate(function() {
                                            //     return document.cookie;
                                            // })

                                            // this.capture('download/114/' + (+new Date()) + '.png');

                                            // 进入预约医生的页面
                                            this.thenOpen(jumpToDoctorUrl, {
                                                method: 'get',
                                                headers: {
                                                     'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                                                     'Accept-Language':'zh-CN,zh;q=0.8',
                                                     'Connection':'keep-alive',
                                                     // 'Cookie': cookie,
                                                     'Host':'www.bjguahao.gov.cn',
                                                     'Referer': ref,
                                                     'Upgrade-Insecure-Requests':1,
                                                }
                                            }).then(function() {

                                                // this.echo('success|haha..:::>>>>>>>>>>|');
                                                // this.capture('download/114/' + (+new Date()) + '.png');
                                                // return

                                                // 点击发送验证码
                                                this.mouse.click('#btnSendCodeOrder');

                                                this.waitForAlert(function(response) {    // 等待弹框出现  casperjs会自动将alert弹框关闭
                                                    this.wait(1000);
                                                }).then(function() {
                                                    var yzm = '';

                                                    while(true) {
                                                        sleep(1000);    // 每隔1秒请求一次验证码
                                                        yzm = this.evaluate(getYZM, username);
                                                        if(yzm) {
                                                            break;
                                                        }
                                                    }

                                                    // 填写手机验证码等相关信息
                                                    if(yzm) {
                                                        this.evaluate(function(jzk, ybk, bxlx, yzm) {
                                                            $('#Rese_db_dl_jzk').val(jzk); // 填写就诊卡
                                                            $('#Rese_db_dl_ybk').val(ybk); // 填写医保卡
                                                            $('.Rese_db_dl_select option').eq(bxlx).get(0).selected = true;    //  选择报销类型
                                                            $('#Rese_db_dl_dxyzid').val(yzm); // 填写手机验证码
                                                        }, jzk, ybk, bxlx, yzm);

                                                        // 点击预约
                                                        this.mouse.click('#Rese_db_qryy_btn');
                                                        this.wait(200);

                                                        this.then(function() {
                                                            this.echo('success|');
                                                            // this.capture('download/114/' + (+new Date()) + '.png');
                                                        })
                                                    }else {
                                                        this.echo('failed|手机验证码获取失败|');
                                                    }
                                                })
                                            })
                                        }else {
                                            this.echo('failed|' + jumpToDoctorUrl + '|');
                                        }
                                    })
                                }else {
                                    this.echo('failed|该时间段不能预约或者约满，请选择其他时间预约|');
                                }
                            }else {
                                this.echo('failed|该时间段不可预约，请选择其他时间预约|');
                            }
                        })
                    }else { // 如果该页没有查到医院的话 
                        this.echo('failed|你所预约的医院科室：' + department + '不存在|');
                    }
                }
            })
        }else { // 如果该页没有查到医院的话 
            this.echo('failed|没有你要预约的医院链接|');
        }
    }else {
        this.echo('failed|没有搜索到你要预约的医院|');
    }
});

casper.run();

// 睡眠方法
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

// 获取跳转链接
function getJumpURL(selector, name) {
    var url = null;
    var links = document.querySelectorAll(selector);
    if(name) {
        for(var i = 0; i < links.length; i ++ ) {
            var link = links[i];
            if(link.innerHTML.trim() == name) {
                url = window.location.origin + link.getAttribute('href');
                break;
            }
        }
    }else {
        var link = links[0].getAttribute('href');
        url = window.location.origin + link.getAttribute('href');
    }
    return url;
}

// 获取值班医生的信息  发送ajax
function getPartDutyUrl(time) {
    var href = '';
    var loc = window.location.href;
    var pos1 = loc.lastIndexOf('\/') + 1;
    var pos2 = loc.lastIndexOf('.');

    var s = loc.slice(pos1, pos2).split('-');
    var hospitalId = s[0];
    var departmentId = s[1];

    var t = time.split('_');
    var dutyCode = t[0];
    var dutyDate = t[1];

    $.ajax({
        url: 'http://www.bjguahao.gov.cn/dpt/partduty.htm',
        type: 'POST',
        async: false,
        data: {
            hospitalId: hospitalId,
            departmentId: departmentId,
            dutyCode: dutyCode,
            dutyDate: dutyDate,
            isAjax: true
        },
        success: function(res) {
            res = typeof res == 'string' ? JSON.parse(res) : res;   // 返回的结果是字符串
            if(res.code == 200) {
                var r = res.data[0];    // 默认选第一个医生
                href = window.location.origin + '/order/confirm/' + r.hospitalId +
                    '-' + r.departmentId + '-' + r.doctorId + '-' + r.dutySourceId + '.htm';
            }else {
                href = 'ajax success, but 没有医生的数据';
            }
            // href = res;
        },
        error: function() {
            href = 'ajax failed';
        }
    })

    return href;
}

// 进入预约医生的页面
function enterDoctor(url) {
    return window.location.origin + url;
}

// 查找符合条件的预约按钮
function getAppointmentBtn(time) {
    var btn = null;
    $('.ksorder_kyy').each(function() {
        var $this = $(this);
        var hv = $this.find('input[type="hidden"]').val();
        if(hv.indexOf(time) != -1) {
            btn = hv;
            $this.get(0).click();
            // btn = $this.get(0);
            return false;
        }
    })
    return btn;
}

// 获取手机验证码
function getYZM(phone) {
    var code = '';
    var interTime = 2 * 60 * 1000; // 验证码时间间隔不能超过2min
    $.ajax({
        url: 'http://xlyqq.xilexuan.com/scriptmanager/cardPoolAction.do?method=getSms',
        type: 'GET',
        data: {
            phone: phone
        },
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
