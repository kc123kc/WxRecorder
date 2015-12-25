$(function() {
    var _jsApiList = [
        'checkJsApi',
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
        'onMenuShareQZone',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'translateVoice',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'onVoicePlayEnd',
        'pauseVoice',
        'stopVoice',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay',
        'openProductSpecificView',
        'addCard',
        'chooseCard',
        'openCard'
    ];

    var wxReq = $.ajax({
        url: 'http://www.skjc423.com/novel/user/ticket',
        type: 'post',
        dataType: 'json',
        data: {
            url: location.href.split('#')[0]
                //url: 'http://www.skjc423.com/novel/user/ticket'
        }
    }).done(function(r) {
        console.log(r);
        wx.config({
            appId: r.appid,
            // debug: true,
            timestamp: r.timestamp,
            nonceStr: r.nonceStr,
            signature: r.signature,
            jsApiList: _jsApiList
        });
    });

    // 当准备好后先显示
    $.when(wxReq).done(function() {
        Main.init();
    });
});

var Main = (function() {
    var g_Voice = {
        localId: '',
        serverId: ''
    };

    var g_IsPlayMode = false;
    var g_isRecording = false;

    // 解析Url的?参数
    var getQueryString = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)
            return unescape(r[2]);
        return -1;
    }

    // 点击日志
    var clickLog = function(actionName) {
        var param = {
            action: actionName
        };

        upLogger.clickLog(param);
    }

    // 分享按钮
    $('#shareArea').click(function() {
        alert("点击右上角分享当前录音~");
        clickLog("ShareArea");
        setShareInfo();
    });

    // 切换到录音模式
    $('#recordArea').click(function() {
        remoteAudioStopPlaying();
        clickLog("RecordArea");
        showRecordMode();
    });

    // 中间的录音(播放)
    $('#main').click(function() {
        if (isPlayMode()) {
            switchPlayStatus();
        } else {
            switchRecordStatus();
        }
    });

    // 录音模式下的播放
    $('#control').click(function() {
        if (isPlayingRecord()) {
            stopPlayingRecord();
        } else {
            startPlayingRecord();
        }
    });

    // 初始化
    var onLoadFinish = function() {
        // alert("Init|" + getQueryString('fileId'));
        wx.ready(function() {
            // 下载音频
            if ((g_Voice.serverId == -1 || g_Voice.serverId == '') && isPlayMode()) {
                // alert("showPlayMode downloadVoice");
                wx.downloadVoice({
                    serverId: getQueryString('fileId'),
                    success: function(res) {
                        // alert('下载语音成功，localId 为' + res.localId);
                        g_Voice.serverId = getQueryString('fileId');
                        g_Voice.localId = res.localId;
                        setShareInfo();
                    }
                });
            }

            // 监听录音自动停止
            wx.onVoiceRecordEnd({
                complete: function(res) {
                    g_Voice.localId = res.localId;
                    setInfoText("");
                    g_isRecording = false;
                    $('#control').show();
                    alert('录音时间超过一分钟,自动停止 -.-');
                    uploadRecord();
                }
            });

            // 监听语音播放完毕接口
            wx.onVoicePlayEnd({
                success: function(res) {
                    _onVoicePlayEnd(res);
                }
            });

            var _onVoicePlayEnd = function(res) {
                if (isPlayMode()) {
                    remoteAudioStopPlaying();
                } else {
                    stopPlayingRecord();
                }
            }

            // 隐藏所有非基本菜单项
            wx.hideAllNonBaseMenuItem({
                success: function() {
                    // TODO::
                }
            });

            // 显示特定菜单项
            wx.showMenuItems({
                menuList: [
                    "menuItem:share:appMessage", // 分享给朋友
                    'menuItem:share:timeline' // 分享到朋友圈
                ],
                success: function(res) {
                    // TODO::
                },
                fail: function(res) {
                    // TODO::
                }
            });

            setShareInfo();
        });

        $('#waiting').fadeOut();
        $('#recordArea').removeClass('hide');
        $('#recordArea').addClass('function');
        $('#shareArea').removeClass('hide');
        $('#shareArea').addClass('function');
        $('#main').removeClass('hide');
        $('#control').removeClass('hide');
        if (getQueryString('fileId') == -1) {
            showRecordMode();
        } else {
            showPlayMode();
        }
    }

    // 显示播放模式*
    var showPlayMode = function() {
        console.log("showPlayMode");
        setInfoText("还是赶紧听下Ta说了什么吧");
        g_IsPlayMode = true;
        $('#main').removeClass('recordMode');
        $('#main').addClass('playMode');
        $('#control').hide();
    }

    // 显示录音模式
    var showRecordMode = function() {
        console.log("showRecordMode");
        setInfoText("录一段话给Ta");
        g_Voice.serverId = '';
        setShareInfo();
        g_IsPlayMode = false;
        $('#recordArea').hide();
        $('#main').removeClass('playMode');
        $('#main').addClass('recordMode');
        $('#control').hide();
    }

    // 切换播放模式下的播放状态
    var switchPlayStatus = function() {
        console.log("switchPlayStatus");
        if (isPlaying()) {
            remoteAudioStopPlaying();
        } else {
            remoteAudioStartPlaying();
        }
    }

    // 播放模式下停止播放
    var remoteAudioStopPlaying = function() {
        console.log("remoteAudioStopPlaying");
        wx.stopVoice({
            localId: g_Voice.localId
        });
        setInfoText("还是赶紧听下Ta说了什么吧");
        $('#main').removeClass('stopMode');
        $('#main').addClass('playMode');
    }

    // 播放模式下开始播放*
    var remoteAudioStartPlaying = function() {
        if (g_Voice.serverId == -1 || g_Voice.serverId == '') {
            clickLog("PlayAudio_Waiting");
            alert("音频加载中..请稍后")
            return;
        }
        clickLog("PlayAudio_Succ");
        wx.playVoice({
            localId: g_Voice.localId
        });
        setInfoText("");
        console.log("remoteAudioStartPlaying");
        $('#main').removeClass('playMode');
        $('#main').addClass('stopMode');
    }

    // 切换录音模式下的录音状态
    var switchRecordStatus = function() {
        if (isRecording()) {
            console.log("switchRecordStatus|Stop");
            var callback = function(res) {
                setInfoText("");
                g_isRecording = false;
                $('#control').show();
                if (null != res) {
                    g_Voice.localId = res.localId;
                }
                uploadRecord();
            }
            stopRecord(callback);
        } else {
            console.log("switchRecordStatus|Start");
            var callback = function() {
                setInfoText("录音中");
                g_isRecording = true;
                $('#control').hide();
            }
            stopPlayingRecord();
            startRecord(callback);
        }
    }

    // 开始录音*
    var startRecord = function(callback) {
        console.log("startRecord");
        clickLog("StartRecord");
        callback();

        wx.startRecord({
            cancel: function() {
                clickLog("StartRecord_Cancel");
                stopPlayingRecord();
                alert('要先授权录音哦~');
            }
        });
    }

    // 停止录音*
    var stopRecord = function(callback) {
        console.log("stopRecord");
        wx.stopRecord({
            success: function(res) {
                callback(res);
            },
            fail: function(res) {
                alert("录音失败 T_T");
            }
        });
    }

    // 上传录音
    var uploadRecord = function() {
        wx.uploadVoice({
            localId: g_Voice.localId,
            isShowProgressTips: 0,
            success: function(res) {
                //alert('上传语音成功，serverId 为' + res.serverId);
                clickLog("UploadRecord");
                g_Voice.serverId = res.serverId;
                setShareInfo();
            }
        });
    }

    // 开始播放录音*
    var startPlayingRecord = function() {
        console.log("startPlayingRecord|" + g_Voice.localId);
        if (g_Voice.localId == -1 || g_Voice.localId == "") {
            console.log("startPlayingRecord|localId not exist");
            return;
        }
        wx.playVoice({
            localId: g_Voice.localId
        });
        setInfoText("录音播放中");
        $('#control').removeClass('play');
        $('#control').addClass('stop');
    }

    // 停止播放录音*
    var stopPlayingRecord = function() {
        console.log("stopPlayingRecord|" + g_Voice.localId);
        if (g_Voice.localId == -1 || g_Voice.localId == "") {
            console.log("stopPlayingRecord|localId not exist");
            return;
        }
        wx.stopVoice({
            localId: g_Voice.localId
        });
        setInfoText("");
        $('#control').removeClass('stop');
        $('#control').addClass('play');
    }

    // 分享内容设置*
    var setShareInfo = function() {
        console.log("setShareInfo");
        if (isShareRecord()) {
            recordModeShare();
        } else {
            playModeShare();
        }
    }

    // 当前是否为播放模式
    var isPlayMode = function() {
        return g_IsPlayMode;
    }

    // 当前是否为录音模式
    var isRecording = function() {
        return g_isRecording;
    }

    // 是否当前在播放模式下并且正在播放
    var isPlaying = function() {
        return ($('#main').hasClass('stopMode') && isPlayMode());
    }

    // 是否当前在播放模式下并且正在播放录音
    var isPlayingRecord = function() {
        return ($('#control').hasClass('stop') && !isPlayMode());
    }

    // 设置文字描述
    var setInfoText = function(t) {
        $("#infoText").text(t);
    }

    // 是否分享当前录音
    var isShareRecord = function() {
        return (g_Voice.serverId != -1 && g_Voice.serverId != '');
    }

    // 播放模式下的分享
    var playModeShare = function() {
        var shareData = {
            title: '简单得不能再简单的录音机',
            desc: '录下你想说的，发给Ta吧',
            link: "http://www.skjc423.com/res/recorder/index.html?fileId=-1",
            imgUrl: 'http://7xpfm0.com1.z0.glb.clouddn.com/Web_recorder.png',
            trigger: function(res) {
                // TODO::
            },
            success: function(res) {
                clickLog("ShareApp_Play_Succ");
            },
            cancel: function(res) {
                clickLog("ShareApp_Play_Cancel");
            },
            fail: function(res) {

            }
        };
        wx.onMenuShareAppMessage(shareData);

        var timelineShareData = {
            title: '录下你想说的，发给Ta吧',
            desc: '录下你想说的，发给Ta吧',
            link: "http://www.skjc423.com/res/recorder/index.html?fileId=-1",
            imgUrl: 'http://7xpfm0.com1.z0.glb.clouddn.com/Web_recorder.png',
            trigger: function(res) {
                // TODO::
            },
            success: function(res) {
                clickLog("ShareTimeLine_Play_Succ");
            },
            cancel: function(res) {
                clickLog("ShareTimeLine_Play_Cancel");
            },
            fail: function(res) {

            }
        };
        wx.onMenuShareTimeline(timelineShareData);
    }

    // 录音模式下的分享
    var recordModeShare = function() {
        if (!isShareRecord()) {
            console.log("recordModeShare|Not exist")
            playModeShare();
            return;
        }
        var l = "http://www.skjc423.com/res/recorder/index.html?fileId=" + g_Voice.serverId;
        var shareData = {
            title: '简单得不能再简单的录音机',
            desc: '我反正是不会点进去听的',
            link: l,
            imgUrl: 'http://7xpfm0.com1.z0.glb.clouddn.com/Web_recorder.png',
            trigger: function(res) {
                // TODO::
            },
            success: function(res) {
                clickLog("ShareApp_Record_Succ");
            },
            cancel: function(res) {
                clickLog("ShareApp_Record_Cancel");
            },
            fail: function(res) {

            }
        };
        wx.onMenuShareAppMessage(shareData);

        var timelineShareData = {
            title: '我反正是不会点进去听的',
            desc: '我反正是不会点进去听的',
            link: l,
            imgUrl: 'http://7xpfm0.com1.z0.glb.clouddn.com/Web_recorder.png',
            trigger: function(res) {
                // TODO::
            },
            success: function(res) {
                clickLog("ShareTimeLine_Record_Succ");
            },
            cancel: function(res) {
                clickLog("ShareTimeLine_Record_Cancel");
            },
            fail: function(res) {

            }
        };
        wx.onMenuShareTimeline(timelineShareData);
    }

    return {
        init: onLoadFinish
    }
})();
