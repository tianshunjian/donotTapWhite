
cc.Class({
    extends: cc.Component,

    properties: {
        bg:cc.Node,
        movePanel:cc.Node,
        cameraNode:cc.Node,
        //右上角label
        counterLabel:cc.Label,//计时器
        numLabel:cc.Label,//点击的黑块数

        colorPrefab:cc.Prefab,

        //提示层
        prompNode:cc.Node,
        prompLabel:cc.Label,
        clickShow:cc.Node,
        circleNode:cc.Node,
        clickNode:cc.Node,
        clickStartLabel:cc.Label,

        //结果页
        overNode:cc.Node,
        overBg:cc.Node,
        modeLabel:cc.Label,
        resultLabel:cc.Label,
        timeLabel:cc.Label,
        clickBlackLabel:cc.Label,
        restartBtn:cc.Node,
        backBtn:cc.Node,

        playType:0,//游戏模式

        blackNumber:20,//经典模式下,需要点击的黑块数
        limitTime:10,//限时模式下的时间限制
    },

    //设置类型，本次黑块数/时间限制，在Start场景中调用
    setTypeAndNumber:function(type,num){
        this.playType = type;
        if (type === 0){
            //经典模式
            this.blackNumber = num;
            this.prompLabel.string = '以最快的速度点击'+num+'个黑块，即可胜利';
        }else if(type === 1){
            //限时模式
            this.limitTime = num;
            this.prompLabel.string = '在'+num+'s内，尽可能多的点击黑块';
        }else if (type === 2){
            //街机模式
            this.prompLabel.string = '不要漏掉任何一个黑块儿，速度会越来越快哟';
        }

        //获取历史最好成绩
        this.getHistory();

        this.reset();
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        this.initAllProperties();
    },

    update (dt) {
        if (this.isStartTimer){
            //计时
            if (this.playType === 0){
                //经典模式
                this.timeForBlack += dt;
                this.counterLabel.string = this.timeForBlack.toFixed(3)+'"';
                this.numLabel.string = this.touchBlackNum+'块';
            }else if (this.playType === 1){
                //限时模式
                this.timeForBlack -= dt;
                this.counterLabel.string = this.timeForBlack.toFixed(2)+'"';
                this.numLabel.string = this.touchBlackNum+'块';
            }else if (this.playType === 2) {
                this.updateForInfinite(dt);
            }
        }
    },

    //街机模式实时更新
    updateForInfinite:function(dt){
        //街机模式
        this.timeForBlack += dt;
        this.counterLabel.string = this.touchBlackNum+'块';

        let bottomPos = this.getPosition(this.curBottomRow,0);
        let threshold = this.nodeHeight +this.rowSpan;
        if (this.YForMoved - bottomPos.y >= threshold){
            let preRow = this.curBottomRow;
            //判断是否错过了黑块
            for (let j=0;j<4;++j){
                let node = this.movePanel.getChildByTag(preRow*4+j);
                let comp = node.getComponent('ColorPrefab');
                if (comp.isBlack && !comp.isClicked) {
                    //错过了黑块
                    this.isStartTimer = false;
                    this.isWinOrLose = true;
                    let p = this.cameraNode.position;
                    p.y -= threshold;
                    let act1 = cc.moveTo(0.5,p);
                    let finish = cc.callFunc(()=>{
                        let act1 = cc.tintTo(0.15,255,0,0);
                        let act2 = cc.tintTo(0.15,255,255,255);
                        let seq = cc.sequence(act1,act2,act1).repeat(2);
                        let finish = cc.callFunc(()=>{
                            this.showResult(false);
                        });
                        comp.bg.runAction(cc.sequence(seq,finish));
                    });
                    this.cameraNode.runAction(cc.sequence(act1,finish));
                    return;
                }
            }
            let tmpNum = parseInt(Math.random()*100%4);
            for (let j=0;j<4;++j){
                let node = this.movePanel.getChildByTag(preRow*4+j);
                let comp = node.getComponent('ColorPrefab');
                node.position = this.getPosition(this.curTopRow,j);
                node.tag = 4*this.curTopRow+j;
                comp.setBgColorType(j===tmpNum ? 1:0);
            }
            this.curBottomRow++;
            this.curTopRow++;
        }

        if (this.isNeedAddOffset && this.touchBlackNum!==0 && this.touchBlackNum%20===0 && this.offsetForInfinite<=40){
            this.isNeedAddOffset = false;
            this.offsetForInfinite += 2;
        }
        this.cameraNode.y += this.offsetForInfinite;
        this.YForMoved += this.offsetForInfinite;
    },

    //获取历史最好成绩
    getHistory:function(){
        if (this.playType === 0){
            this.StorageKey = 'Classical';
            this.historyScore = {
                'for20':999999,
                'for50':999999,
                'for100':999999,
                'for200':999999,
            };
        } else if(this.playType === 1){
            this.StorageKey = 'LimitTime';
            this.historyScore = {
                'for10':0,
                'for30':0,
                'for60':0,
                'for100':0,
            };
        }else if (this.playType === 2){
            this.StorageKey = 'Infinite';
            this.historyScore = {
                'forInfinite':0,
            };
        }

        let item = cc.sys.localStorage.getItem(this.StorageKey);
        if (item){
            let storage = JSON.parse(item);
            for (let prop in storage){
                this.historyScore[prop] = storage[prop];
            }
        }
    },

    initAllProperties:function(){
        let winSize = cc.director.getWinSize();
        let visibleSize = cc.director.getVisibleSize();

        this.bg.width = winSize.width;
        this.bg.height = winSize.height;

        this.rowSpan = 2;
        this.nodeWidth = (this.bg.width-this.rowSpan*3)/4;
        this.nodeHeight = (this.bg.height-this.rowSpan*3)/4;

        this.movePanel.position = cc.p(-this.bg.width/2, -this.bg.height/2);

        //相机的初始位置
        this.originalCameraPos = this.cameraNode.position;
        //移动背景的初始位置
        this.originalPosition = this.movePanel.position;
        //提示点击手势的初始位置
        this.originalClickPos = this.clickNode.position;

        //结束页
        this.overNode.on(cc.Node.EventType.TOUCH_START,()=>{
            return true;
        });
        this.restartBtn.on('click',()=>{
            this.reset();
        });
        this.backBtn.on('click',()=>{
            cc.director.loadScene('Start');
        });
    },

    //i行j列的坐标
    getPosition:function(i,j){
        let w = this.nodeWidth;
        let h = this.nodeHeight;
        let x = (w+this.rowSpan)*j;
        let y = (h+this.rowSpan)*i;
        return cc.p(x,y);
    },

    reset:function () {
        this.overNode.active = false;

        this.isWinOrLose = false;//本局是否已经有结果

        this.isStartTimer = false;//是否开始计时，当用户点击第一个黑白块后开始计时

        this.touchBlackNum = 0;//点击的黑块个数
        this.touchWhiteNum = 0;//点击的白块个数

        this.curBottomRow = 0;//底部row计数
        this.curTopRow = 6;//顶部row计数

        if (this.playType === 0){
            //经典模式
            this.timeForBlack = 0;//计时用
            this.counterLabel.string = this.timeForBlack.toFixed(3)+'"';
            this.numLabel.string = this.touchBlackNum+'块';
            this.numLabel.node.active = true;
            this.clickStartLabel.string = '点击这一行的黑块';
        }else if (this.playType === 1){
            //限时模式
            this.timeForBlack = this.limitTime;//倒计时用
            this.counterLabel.string = this.timeForBlack.toFixed(2)+'"';
            this.numLabel.string = this.touchBlackNum+'块';
            this.numLabel.node.active = true;
            this.clickStartLabel.string = '点击这一行的黑块';
        }else if (this.playType === 2){
            //街机模式
            // this.curTopRow = 6;//顶部row计数
            this.counterLabel.string = '0块';
            this.numLabel.node.active = false;
            this.clickStartLabel.string = '点击开始';
        }

        this.movePanel.position = this.originalPosition;
        this.cameraNode.position = this.originalCameraPos;
        this.prompNode.active = true;

        this.movePanel.removeAllChildren();
        //初始curTopRow行4列
        for (let i=0;i<this.curTopRow;++i){
            this.generateARowNode(i);
        }
    },

    //设置提示层点击手势的位置为: (1,blackNum)的中点
    setPrompNodePos:function(i,j){
        let pos = this.getPosition(i,j);
        pos.x += this.nodeWidth/2;
        pos.y += this.nodeHeight/2;
        let worldPos = this.movePanel.convertToWorldSpaceAR(pos);

        let tmpPos = this.prompNode.convertToNodeSpaceAR(worldPos);
        this.clickShow.position = tmpPos;

        let sP = this.originalClickPos;
        let action1 = cc.moveTo(0.4,cc.p(sP.x,sP.y-20));
        let action2 = cc.moveTo(0.4,sP);
        let showFuc = cc.callFunc(()=>{
            this.circleNode.runAction(cc.show());
            this.scheduleOnce(()=>{
                this.circleNode.runAction(cc.hide());
            },0.1);
        });
        let sequence = cc.sequence(showFuc,action1,action2).repeatForever();
        this.clickNode.runAction(sequence);
    },

    //生成一行新块
    generateARowNode:function(i){
        let blackNum = parseInt(Math.random()*100%4);
        if (i===1){
            //设置提示层点击手势的位置为: (1,blackNum)的中点
            this.setPrompNodePos(i,blackNum);
        }
        for (let j=0;j<4;++j){
            let node = cc.instantiate(this.colorPrefab);
            node.width = this.nodeWidth;
            node.height = this.nodeHeight;
            node.position = this.getPosition(i,j);
            node.tag = i*4+j;
            let tmpPrefab = node.getComponent('ColorPrefab');
            if (i===0){
                //第0行初始行，
                // 1:黑色块，0：白色块，-1：初始第一行
                tmpPrefab.setBgColorType(-1);
            } else {
                if (this.playType === 0){
                    //经典模式
                    if (i===this.blackNumber+2){
                        // 第blackNumber+2行为终止行
                        // 1:黑色块，0：白色块，-1：初始第一行
                        tmpPrefab.setBgColorType(-1);
                    } else if(i>this.blackNumber+2) {
                        tmpPrefab.setBgColorType(0);
                    }else {
                        // 1:黑色块，0：白色块
                        tmpPrefab.setBgColorType(j===blackNum ? 1:0);
                    }
                } else if (this.playType === 1){
                    //限时模式
                    tmpPrefab.setBgColorType(j===blackNum ? 1:0);
                }else if (this.playType === 2){
                    //接机模式
                    tmpPrefab.setBgColorType(j===blackNum ? 1:0);
                }

            }
            this.movePanel.addChild(node);

            node.on(cc.Node.EventType.TOUCH_START,this.onPrefabTouchStart,this);
        }
    },

    //点击响应
    onPrefabTouchStart:function (event) {
        if (this.isWinOrLose){
            return;
        }
        let target = event.target;
        let i = parseInt(target.tag/4);
        let j = target.tag%4;

        if (this.playType===0 || this.playType===1){
            // 经典和限时模式 处理
            this.touchForClassicalAndLimiteTime(target,i);
        }else if (this.playType === 2){
            // 街机模式 处理
            this.touchForInfinite(target,i);
        }
    },

    //累计点击的黑白块数,i为点击的第几行
    accumulateTouchColor:function(i,prefab){
        if (i === 1) {
            //启动块，不累计
            if (prefab.isBlack) {
                this.playAudioWithTag(i);
                prefab.bg.color = cc.Color.GRAY;
            }
        }else {
            if (prefab.isBlack) {
                this.playAudioWithTag(i);
                this.touchBlackNum++;
                prefab.bg.color = cc.Color.GRAY;
            }else {
                this.touchWhiteNum++;
            }
        }
    },

    //点击了白块，显示失败结果
    touchWhiteColorResult:function(prefab){
        //点击白块大于等于 1 个，失败
        if (this.playType === 1){
            this.unschedule(this.callbackForLimitTime);
        }
        this.isWinOrLose = true;
        this.isStartTimer = false;
        let act1 = cc.tintTo(0.15,255,0,0);
        let act2 = cc.tintTo(0.15,255,255,255);
        let seq = cc.sequence(act1,act2,act1).repeat(2);
        let finish = cc.callFunc(()=>{
            this.showResult(false);
        });
        prefab.bg.runAction(cc.sequence(seq,finish));
    },

    //街机模式的点击处理，起始只能点第2行，开始后都可以点击
    touchForInfinite:function(target,i){
        let prefab = target.getComponent('ColorPrefab');
        if (prefab.isClicked){
            return;
        }
        prefab.isClicked = true;
        this.isNeedAddOffset = true;
        if (!this.isStartTimer && i===this.curBottomRow+1){
            //初始点击，进入游戏界面，本次点击不累加块数
            this.prompNode.active = false;
            this.clickNode.stopAllActions();
            this.isStartTimer = true;
            this.YForMoved = 0;
            //街机模式初始移动位移，随着点击块数增加，递增，最大40
            this.offsetForInfinite = 14;
        }
        //累计点击的黑白块数
        this.accumulateTouchColor(i,prefab);

        //点击了白块，失败
        if (this.touchWhiteNum === 1){
            this.touchWhiteColorResult(prefab);
        }
    },

    //经典和限时模式的点击处理，任何时候只能点击第2行
    touchForClassicalAndLimiteTime:function(target,i){
        let prefab = target.getComponent('ColorPrefab');
        if (i === this.curBottomRow+1){
            if (prefab.isClicked){
                return;
            }
            prefab.isClicked = true;
            //点击了可以点击的 row 行，进入计时流程
            if (!this.isStartTimer) {
                //初始点击，进入游戏界面，本次点击不累加块数
                this.prompNode.active = false;
                this.clickNode.stopAllActions();
                this.isStartTimer = true;
                if (this.playType === 1){
                    //限时模式
                    this.callbackForLimitTime = function () {
                        if (this.isWinOrLose){
                            //时间未用完之前，已经有结果了，即已经输了
                            this.unschedule(this.callbackForLimitTime);
                            return;
                        }
                        //时间耗完
                        this.isWinOrLose = true;
                        this.isStartTimer = false;
                        this.counterLabel.string = 'TIME OUT';
                        let counterNode = this.counterLabel.node;
                        let action1 = cc.scaleTo(0.15,1.3);
                        let action2 = cc.scaleTo(0.15,1.0);
                        let sequence = cc.sequence(action1,action2);
                        counterNode.runAction(sequence);

                        let act1 = cc.tintTo(0.15,0,255,0);
                        let act2 = cc.tintTo(0.15,255,255,255);
                        let seq = cc.sequence(act1,act2,act1).repeat(3);
                        let finish = cc.callFunc(()=>{
                            this.showResult(true);
                        });
                        prefab.bg.runAction(cc.sequence(seq,finish));
                    };
                    this.scheduleOnce(this.callbackForLimitTime,this.limitTime);
                }
            }

            //累计点击的黑白块数
            this.accumulateTouchColor(i,prefab);

            if (this.touchWhiteNum === 1){
                //点击白块大于等于 1 个，失败
                this.touchWhiteColorResult(prefab);
            } else {
                if (this.playType === 0){
                    //经典模式
                    if (this.touchBlackNum === this.blackNumber){
                        //点击黑块数达到要求，胜利
                        this.isWinOrLose = true;
                        this.isStartTimer = false;
                        this.numLabel.string = this.touchBlackNum+'块';
                        let act1 = cc.tintTo(0.15,0,255,0);
                        let act2 = cc.tintTo(0.15,255,255,255);
                        let seq = cc.sequence(act1,act2,act1).repeat(3);
                        let finish = cc.callFunc(()=>{
                            this.showResult(true);
                        });
                        prefab.bg.runAction(cc.sequence(seq,finish));
                    } else {
                        //移动
                        this.moveCamera();
                    }
                } else if (this.playType === 1){
                    //限时模式, 移动
                    this.moveCamera();
                }
            }
        }
    },

    //播分段的音频
    playAudioWithTag:function(index){
        index = index%461+1;
        let url = cc.url.raw('resources/audio/croatian/'+index+'.mp3');
        cc.audioEngine.play(url, false, 1);
    },

    //移动相机，经典和限时模式用
    moveCamera:function () {
        //先生成新的一行
        this.generateARowNode(this.curTopRow);

        let preRow = this.curBottomRow;

        this.curBottomRow++;
        this.curTopRow++;

        //移动相机
        let pos = this.cameraNode.position;
        pos.y += this.nodeHeight+this.rowSpan;
        let action = cc.moveTo(0.1,pos);
        let finish = cc.callFunc(()=>{
            for (let j=0;j<4;++j){
                this.movePanel.removeChildByTag(preRow*4+j);
            }
        });
        let seq = cc.sequence(action,finish);
        this.cameraNode.runAction(seq);
    },

    //展示结果页
    showResult:function (success) {
        if (this.playType === 0){
            //经典模式
            this.showResultForClassical(success);
        } else if (this.playType === 1){
            //限时模式
            this.showResultForLimitTime(success);
        }else if (this.playType === 2){
            //街机模式
            this.showResultForInfinite();
        }

        this.overNode.active = true;
        // this.overNode.scale = 0.1;
        // let act = cc.scaleTo(0.2,1.0,1.0);
        // this.overNode.runAction(act);
    },

    //经典模式的结果页
    showResultForClassical:function (success) {
        this.modeLabel.string = '经典模式';
        this.clickBlackLabel.string = ''+this.blackNumber;
        this.clickBlackLabel.node.active = true;
        if (success){
            this.overBg.color = new cc.Color(67,212,81);
            this.resultLabel.string = this.timeForBlack.toFixed(3)+'"';
            this.timeLabel.node.active = true;
            if (this.historyScore['for'+this.blackNumber] > this.timeForBlack){
                this.timeLabel.string = '新纪录';
                this.historyScore['for'+this.blackNumber] = this.timeForBlack;
                cc.sys.localStorage.setItem(this.StorageKey,JSON.stringify(this.historyScore));
            } else {
                this.timeLabel.string = '最佳 '+this.historyScore['for'+this.blackNumber].toFixed(3)+'"';
            }
        } else {
            this.overBg.color = new cc.Color(250,34,38);
            this.resultLabel.string = '败了!';
            if (this.historyScore['for'+this.blackNumber] === 999999){
                this.timeLabel.node.active = false;
            } else {
                this.timeLabel.node.active = true;
                this.timeLabel.string = '最佳 '+this.historyScore['for'+this.blackNumber].toFixed(3)+'"';
            }
        }
    },
    //限速模式的结果页
    showResultForLimitTime:function (success) {
        this.modeLabel.string = '限时模式';
        this.clickBlackLabel.string = ''+this.limitTime+'s';
        this.clickBlackLabel.node.active = true;
        if (success){
            this.overBg.color = new cc.Color(67,212,81);
            this.resultLabel.string = this.touchBlackNum+' 块';
            this.timeLabel.node.active = true;
            if (this.historyScore['for'+this.limitTime] < this.touchBlackNum){
                this.timeLabel.string = '新纪录';
                this.historyScore['for'+this.limitTime] = this.touchBlackNum;
                cc.sys.localStorage.setItem(this.StorageKey,JSON.stringify(this.historyScore));
            } else {
                this.timeLabel.string = '最佳 '+this.historyScore['for'+this.limitTime]+'块';
            }
        } else {
            this.overBg.color = new cc.Color(250,34,38);
            this.resultLabel.string = '败了!';
            if (this.historyScore['for'+this.limitTime] === 0){
                this.timeLabel.node.active = false;
            } else {
                this.timeLabel.node.active = true;
                this.timeLabel.string = '最佳 '+this.historyScore['for'+this.limitTime]+'块';
            }
        }
    },

    //街机模式结果
    showResultForInfinite:function () {
        this.modeLabel.string = '街机模式';
        this.clickBlackLabel.node.active = false;

        this.overBg.color = new cc.Color(67,212,81);
        this.resultLabel.string = this.touchBlackNum+' 块';
        this.timeLabel.node.active = true;
        if (this.historyScore['forInfinite'] < this.touchBlackNum){
            this.timeLabel.string = '新纪录';
            this.historyScore['forInfinite'] = this.touchBlackNum;
            cc.sys.localStorage.setItem(this.StorageKey,JSON.stringify(this.historyScore));
        } else {
            if (this.historyScore['forInfinite'] === 0){
                this.timeLabel.node.active = false;
            }else {
                this.timeLabel.string = '最佳 '+this.historyScore['forInfinite']+'块';
            }
        }
    },

    // start () {},

});
