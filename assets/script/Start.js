
/**
 * 别踩白块
 * 经典模式：目标是在最短的时间内按完20、50、100或200个黑方块，
 * 每按对一个画面会自动下降。
 *
 * 限时模式：给玩家10、30、60或100秒钟，比拼谁能准确按完的色块最多。
 *
 * 街机模式：没有时间限制，但画面会一刻不停的下落，而且速度越来越快，你要在这样的限制下，
 * 尽可能多的按对色块，漏掉或者按错游戏都会结束
 */

cc.Class({
    extends: cc.Component,

    properties: {
        ruleLabel:cc.Label,

        classicalBtn:cc.Node,
        limitTimeBtn:cc.Node,
        infiniteBtn:cc.Node,

        selectBg:cc.Node,
        selectPrefab:cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.classicalBtn.tag = 1000;
        this.limitTimeBtn.tag = 2000;
        this.infiniteBtn.tag = 3000;

        this.classicalBtn.on('click',this.classicalBtnClicked,this);
        this.limitTimeBtn.on('click',this.limitTimeBtnClicked,this);
        this.infiniteBtn.on('click',this.infiniteBtnClicked,this);

        this.selectBg.on(cc.Node.EventType.TOUCH_START,this.hideSelectBg,this);
        this.numArr = [];
        this.posArr = [];
    },

    //街机模式
    infiniteBtnClicked:function(event){
        let target = event.target;
        this.selectedBtnTag = target.tag;
        cc.director.loadScene('Game',()=>{
            let tmp = cc.director.getScene().getChildByName('Canvas');
            let comp = tmp.getComponent('Game');
            comp.setTypeAndNumber(2,target.tag);
        });
    },

    //经典模式
    classicalBtnClicked:function(event){
        let url = cc.url.raw('resources/audio/croatian/6.mp3');
        cc.audioEngine.play(url, false, 1);
        let target = event.target;
        this.selectedBtnTag = target.tag;
        this.selectBg.active = true;

        let arr = [20,50,100,200];
        this.generateSelectNum(target,arr);
    },

    //限时模式
    limitTimeBtnClicked:function(event){
        let target = event.target;
        this.selectedBtnTag = target.tag;
        this.selectBg.active = true;

        let arr = [10,30,60,100];
        this.generateSelectNum(target,arr);
    },

    //生成四个选项
    generateSelectNum:function(target,arr){
        let worldPos = this.node.convertToWorldSpaceAR(target.position);
        let tmpPos = this.selectBg.convertToNodeSpaceAR(worldPos);
        if (this.numArr.length === 0){
            for (let i=0;i<arr.length;++i){
                let node = cc.instantiate(this.selectPrefab);
                node.position = tmpPos;
                node.tag = arr[i];
                node.on(cc.Node.EventType.TOUCH_START,this.selectNum,this);
                this.selectBg.addChild(node);
                this.numArr.push(node);

                let comp = node.getComponent('SelectPrefab');
                comp.setBgAndNum(arr[i]);
            }
        }

        this.generatePos(tmpPos);

        for (let i=0;i<this.numArr.length;++i){
            let node = this.numArr[i];
            node.position = tmpPos;
            node.tag = arr[i];
            let comp = node.getComponent('SelectPrefab');
            comp.setBgAndNum(arr[i]);

            node.scale = 0.1;
            let act1 = cc.moveTo(0.2,this.posArr[i]);
            let act2 = cc.scaleTo(0.2,1.0,1.0);
            let spawn = cc.spawn(act1,act2);
            node.runAction(spawn);
        }
    },

    generatePos:function(srcPos){
        this.posArr = [];
        let offset = 200;
        for (let i=0;i<4;++i){
            let pos;
            switch (i){
                case 0:
                    pos = cc.p(srcPos.x-offset,srcPos.y);
                    break;
                case 1:
                    pos = cc.p(srcPos.x,srcPos.y+offset);
                    break;
                case 2:
                    pos = cc.p(srcPos.x+offset,srcPos.y);
                    break;
                case 3:
                    pos = cc.p(srcPos.x,srcPos.y-offset);
                    break;
            }
            this.posArr.push(pos);
        }
    },

    //收起选择项
    hideSelectBg:function(){
        if (this.isAnimating){
            return;
        }
        this.isAnimating = true;
        let target;
        if (this.selectedBtnTag === 1000){
            target = this.classicalBtn;
        } else if (this.selectedBtnTag === 2000){
            target = this.limitTimeBtn;
        }
        let worldPos = this.node.convertToWorldSpaceAR(target.position);
        let tmpPos = this.selectBg.convertToNodeSpaceAR(worldPos);
        for (let i=0;i<this.numArr.length;++i){
            let node = this.numArr[i];
            let act1 = cc.moveTo(0.2,tmpPos);
            let act2 = cc.scaleTo(0.2,0.1,0.1);
            let spawn = cc.spawn(act1,act2);
            node.runAction(spawn);
        }
        this.scheduleOnce(()=>{
            this.selectBg.active = false;
            this.isAnimating = false;
        },0.2);

    },

    //点击选择项
    selectNum:function (event) {
        let target = event.target;
        let type = 0;
        if (this.selectedBtnTag === 1000){
            //经典模式
            type = 0;
        } else if (this.selectedBtnTag === 2000){
            //限时模式
            type = 1;
        }
        cc.director.loadScene('Game',()=>{
            let tmp = cc.director.getScene().getChildByName('Canvas');
            let comp = tmp.getComponent('Game');
            comp.setTypeAndNumber(type,target.tag);
            // if (type === 0){
            //     //经典模式
            //     comp.setTypeAndNumber(0,target.tag);
            // }else if(type === 1){
            //     //限时模式
            //     comp.setTypeAndNumber(1,target.tag);
            // }
        });
    },

    // start () {},

    // update (dt) {},
});
