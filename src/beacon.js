(function(window, document, undefined) {
    var upBeaconUtil = {
        setCookie: function(sName, sValue, oExpires, sPath, sDomain, bSecure) { //设置cookie信息
            var currDate = new Date(),
                sExpires = typeof oExpires == 'undefined' ? '' : ';expires=' + new Date(currDate.getTime() + (oExpires * 24 * 60 * 60 * 1000)).toUTCString();
            document.cookie = sName + '=' + sValue + sExpires + ((sPath == null) ? '' : (' ;path=' + sPath)) + ((sDomain == null) ? '' : (' ;domain=' + sDomain)) + ((bSecure == true) ? ' ; secure' : '');
        },
        getCookie: function(sName) { //获取cookie信息
            var regRes = document.cookie.match(new RegExp("(^| )" + sName + "=([^;]*)(;|$)"));
            return (regRes != null) ? unescape(regRes[2]) : '-';
        },
        getRand: function() { // 生产页面的唯一标示
            var currDate = new Date();
            var randId = currDate.getTime() + '-';
            for (var i = 0; i < 8; i++) {
                randId += Math.floor(Math.random() * 10);
            }
            return randId;
        },
        parseError: function(obj) {
            var retVal = '';
            for (var key in obj) {
                retVal += key + '=' + obj[key] + ';';
            }
            return retVal;
        },
        getParam: function(obj, flag) { // 参数转化方法
            var retVal = null;
            if (obj) {
                if (upBeaconUtil.isString(obj) || upBeaconUtil.isNumber(obj)) {
                    retVal = obj;
                } else {
                    if (upBeaconUtil.isObject(obj)) {
                        var tmpStr = '';
                        for (var key in obj) {
                            if (obj[key] != null && obj[key] != undefined) {
                                var tmpObj = obj[key];
                                if (upBeaconUtil.isArray(tmpObj)) {
                                    tmpObj = tmpObj.join(',');
                                } else {
                                    if (upBeaconUtil.isDate(tmpObj)) {
                                        tmpObj = tmpObj.getTime();
                                    }
                                }
                                tmpStr += key + '=' + tmpObj + '&';
                            }
                        }
                        tmpStr = tmpStr.substring(0, tmpStr.length - 1);
                        retVal = tmpStr;
                    } else {
                        if (upBeaconUtil.isArray(obj)) {
                            if (upBeaconUtil.length & upBeaconUtil.length > 0) {
                                retVal = obj.join(',');
                            }
                        } else {
                            retVal = obj.toString();
                        }
                    }
                }
            }

            if (!retVal) {
                retVal = '-';
            }

            if (flag) {
                retVal = encodeURIComponent(retVal);
                retVal = this.base64encode(retVal);
            }
            return retVal;
        },
        base64encode: function(G) { //base64加密
            var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var C, E, z;
            var F, D, B;
            z = G.length;
            E = 0;
            C = "";
            while (E < z) {
                F = G.charCodeAt(E++) & 255;
                if (E == z) {
                    C += A.charAt(F >> 2);
                    C += A.charAt((F & 3) << 4);
                    C += "==";
                    break
                }
                D = G.charCodeAt(E++);
                if (E == z) {
                    C += A.charAt(F >> 2);
                    C += A.charAt(((F & 3) << 4) | ((D & 240) >> 4));
                    C += A.charAt((D & 15) << 2);
                    C += "=";
                    break
                }
                B = G.charCodeAt(E++);
                C += A.charAt(F >> 2);
                C += A.charAt(((F & 3) << 4) | ((D & 240) >> 4));
                C += A.charAt(((D & 15) << 2) | ((B & 192) >> 6));
                C += A.charAt(B & 63)
            }
            return C
        },
        getDomain: function() { //获取网站的域名
            return document.URL.substring(document.URL.indexOf("://") + 3, document.URL.lastIndexOf("\/"));
        },
        isString: function(obj) { // 判断是不是String类型
            return (obj != null) && (obj != undefined) && (typeof obj == 'string') && (obj.constructor == String);
        },
        isNumber: function(obj) { // 判断是否是数组
            return (typeof obj == 'number') && (obj.constructor == Number);
        },
        isDate: function(obj) { // 判断是否是日期
            return obj && (typeof obj == 'object') && (obj.constructor == Date);
        },
        isArray: function(obj) { //判断是否是数组
            return obj && (typeof obj == 'object') && (obj.constructor == Array);
        },
        isObject: function(obj) { //判断是否是对象
            return obj && (typeof obj == 'object') && (obj.constructor == Object)
        },
        trim: function(str) { // 去除左右两边空格
            return str.replace(/(^\s*)|(\s*$)/, "");;
        }
    };

    var beaconMethod = {
        beaconPort: "",
        beaconUrl: "/log.gif", //记录访问日志的url
        errorUrl: "/error.gif", //记录错误日志的url
        clickUrl: "/click.gif", //记录点击日志的url
        pageId: typeof _beacon_pageid != 'undefined' ? _beacon_pageid : (_beacon_pageid = upBeaconUtil.getRand()), //生产pageId(页面唯一标示)
        triggerNum: 0,
        protocol: function() { //请求的协议例如http://
            var reqHeader = location.protocol;
            if ('file:' === reqHeader) {
                reqHeader = 'http:';
            }
            return reqHeader + '//';
        },
        domain: function() { //当前域名
        	/*
            var hostname = document.location.hostname;
            if ('' === hostname) {
                hostname = 'localhost';
            }
            */
            var hostname = "www.skjc423.com/res"
            return hostname;
        },
        getRefer: function() { // 获取上游页面信息
            var reqRefer = document.referrer;
            reqRefer == location.href && (reqRefer = '');
            try {
                reqRefer = '' == reqRefer ? opener.location : reqRefer;
                reqRefer = '' == reqRefer ? '-' : reqRefer;
            } catch (e) {
                reqRefer = '-';
            }
            return reqRefer;
        },
        beaconLog: function(addition) { // 记录访问日志方法
            try {
                var httpHeadInd = document.URL.indexOf('://'),
                    httpUrlContent = '{' + upBeaconUtil.getParam(document.URL.substring(httpHeadInd + 2)) + '}',
                    hisPageUrl = '{' + upBeaconUtil.getParam(this.getRefer()) + '}';

                var logPageId = this.pageId,
                    logTitle = document.title;
                if (logTitle.length > 25) {
                    logTitle = logTitle.substring(0, 25);
                }
                logTitle = encodeURIComponent(logTitle);
                var logCharset = (navigator.userAgent.indexOf('MSIE') != -1) ? document.charset : document.characterSet,
                    logQuery = '{' + upBeaconUtil.getParam({
                        pageId: logPageId,
                        //title: logTitle,
                        charset: logCharset,
                        sr: (window.screen.width + '*' + window.screen.height)
                    }) + '}';
                var sparam = {
                    logUrl: httpUrlContent,
                    logHisRefer: hisPageUrl,
                    logQuery: logQuery
                };
                if (upBeaconUtil.isObject(addition)) {
                	for (var key in addition) {
                		sparam[key] = addition[key];
                	}
                }
                this.sendRequest(this.beaconUrl, sparam);
            } catch (ex) {
                this.sendError(ex);
            }
        },
        clickLog: function(sparam) {
            try {
                // 获得pageId
                var clickPageId = this.pageId;
                if (!clickPageId) { // 当pageId值为空，重新计算pageId
                    this.pageId = upBeaconUtil.getRand();
                    clickPageId = this.pageId;
                }
                var triggerNumber = ++this.triggerNum;
                if (upBeaconUtil.isObject(sparam)) { // 当传入参数是javascript对象
                    sparam.pageId = clickPageId;
                    sparam.triggerNum = triggerNumber;
                } else {
                    if (upBeaconUtil.isString(sparam) && sparam.indexOf('=') > 0) { // 当传入参数是字符串
                        sparam += '&pageId=' + clickPageId + "&triggerNum=" + triggerNumber;
                    } else {
                        if (upBeaconUtil.isArray(sparam)) { // 当传入参数是数组
                            sparam.push("pageId=" + clickPageId);
                            sparam.push("triggerNum=" + triggerNumber);
                            sparam = sparam.join('&'); //数组转化为字符串
                        } else { // 其他数据类型
                            sparam = {
                                pageId: clickPageId,
                                triggerNum: triggerNumber
                            };
                        }
                    }
                }
                this.sendRequest(this.clickUrl, sparam); // 发送点击日志
            } catch (ex) {

            }
        },
        sendRequest: function(url, params) {
            var urlParam = '',
                currDate = new Date();
            try {
                if (params) {
                    urlParam = upBeaconUtil.getParam(params, false);
                    urlParam = (urlParam == '') ? urlParam : (urlParam + '&');
                }
                var logImage = new Image();
                logImage.onload = function() {
                    logImage = null;
                }
                var src = this.protocol() + this.domain() + this.beaconPort + url + '?' + urlParam;
                logImage.src = src;
            } catch (e) {

            }
        }
    };
    window.upLogger = beaconMethod;
})(window, document);