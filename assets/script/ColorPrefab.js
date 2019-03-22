
cc.Class({
    extends: cc.Component,

    properties: {
        bg:cc.Node,
        isBlack:false,
        isClicked:false,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
    },

    setBgColorType:function(type){
        this.isClicked = false;
        if (type===1){
            this.isBlack = true;
            this.bg.color = cc.Color.BLACK;
        }else if (type===0){
            this.isBlack = false;
            this.bg.color = cc.Color.WHITE;
        }else {
            this.isBlack = false;
            this.bg.color = cc.Color.GRAY;
        }
    },

    // start () {},

    // update (dt) {},
});
