
cc.Class({
    extends: cc.Component,

    properties: {
        bgColorNode:cc.Node,
        numLabel:cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

    },

    setBgAndNum:function (num) {
        this.colorDic = {
            10:{color:'#fff7eb',bgColor:'#f2b179',fontSize:90},
            20:{color:'#fff7eb',bgColor:'#f2b179',fontSize:90},
            30:{color:'#fff7eb',bgColor:'#f59563',fontSize:90},
            50:{color:'#fff7eb',bgColor:'#f59563',fontSize:90},
            60:{color:'#fff7eb',bgColor:'#f65d3b',fontSize:90},
            100:{color:'#fff7eb',bgColor:'#f57c5f',fontSize:90},
            200:{color:'#fff7eb',bgColor:'#f65d3b',fontSize:90}
        };

        this.numLabel.string = num;

        let color = this.colorDic[num].color;
        let bgColor = this.colorDic[num].bgColor;
        let fontSize = this.colorDic[num].fontSize;

        this.numLabel.node.color = new cc.Color().fromHEX(color);
        this.bgColorNode.color = new cc.Color().fromHEX(bgColor);
    },

    // start () {},

    // update (dt) {},
});
