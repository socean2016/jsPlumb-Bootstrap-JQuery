/*
2018-07-02
created by liuwei
jsPlumb插件配合bootstrap的modal渲染流程图
*/

jsPlumb.ready(function () {

    // setup some defaults for jsPlumb.
    //声明实例，配置信息
    var instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 2}],
        Connector:"StateMachine",
        HoverPaintStyle: {stroke: "#1e8151", strokeWidth: 2 },
        ConnectionOverlays: [
            [ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            } ],
            [ "Label", { label: "default", id: "label", cssClass: "aLabel" }]
        ],
        Container: "canvas"
    });

    instance.registerConnectionType("basic", { anchor:"Continuous", connector:"StateMachine" });

    window.jsp = instance;

    var canvas = document.getElementById("canvas"),
    canvasElement = document.getElementsByClassName("w"),
    saveNodeBtn = document.getElementById("saveNode");
    var addNodeBtn = document.getElementById("addNode");
    var windows = jsPlumb.getSelector(".statemachine-demo .w");

    var data = $("#string").html();
    var unpack=JSON.parse(data);
    
    //连线上的点击事件
    instance.bind("click", function (c) {
        // console.log(c,c.getData(),c.getId());
        var html = '';
        var conditionVal = c.getData();
        for(var p in conditionVal.data){
            html+='<div class="form-group">';
            html+='<label for="name">跳转条件'+p+'</label>';
            html+='<input type="text" class="form-control" key="'+p+'" value="'+conditionVal.data[p]+'" placeholder="请输入">';
            html+='</div>';
        }
        $("#conditionForm").html(html);
        $("#editConnectModal").modal('show');
        $("#submitConnect").bind("click",function(){
            var newData={};
            var input = $("#conditionForm input");
            for(var i=0;i<input.length;i++){
                newData[input.eq(i).attr('key')] = input.eq(i).val();
            }
            c.setData({data:newData});
            $("#submitConnect").unbind("click");
        })
        $("#deleteConnect").bind("click",function(){
            instance.deleteConnection(c);
            $("#deleteConnect").unbind("click");
        })
    });
    
    //每次连接节点的时候必定会触发的事件
    var i=0;
    instance.bind("connection", function (info) {
        // console.log(unpack[1].length,i)
        //这里判断是新节点连线还是已有节点
        if(i>=unpack[1].length){
            var htmlKey = '';
            htmlKey+='<div class="form-group">';
            htmlKey+='<label for="name">跳转条件名称</label>';
            htmlKey+='<input type="text" class="form-control connectKey" value="" placeholder="请输入">';
            htmlKey+='<label for="name">条件值</label>';
            htmlKey+='<input type="text" class="form-control connectValue" value="" placeholder="请输入">';
            htmlKey+='</div>';
            $("#addConditionForm").html(htmlKey);
            $("#addKey").on("click",function(){
                $("#addConditionForm").append(htmlKey);
            })
            $("#addConnectModal").modal('show');
            $('#addConnectModal').on('hide.bs.modal', function () {
                var newData={};
                var connectKey = $(".connectKey");
                var connectValue = $(".connectValue");
                for(var i=0;i<connectKey.length;i++){
                    newData[connectKey.eq(i).val()] = connectValue.eq(i).val();
                }
                console.log(newData);
                info.connection.setData({data:newData});
            })
        }
        else{
            info.connection.setData({data:eval(unpack[1][i]).data})
        }
        var html='';
        html+='<div>'+info.connection.sourceId.substring(0,1)+' to '+info.connection.targetId.substring(0,1);
        html+='</div>';
        info.connection.getOverlay("label").setLabel(html);
        i++;
    });

    //增加新节点
    jsPlumb.on(addNodeBtn, "click", function(e) {
        $("#myModalLabel").html("增加节点");
        $("#deleteBlock").hide();
        $("#myModal").modal('show');
        $("#editBlock").bind("click",function(){
            var newData = {};
            newData ={url:$("#url").val(),describe:$("#describe").val(),owner:$("#owner").val(),isSelfUpdate:$("#isSelfUpdate").prop("checked")}
            newNode('','',e.offsetX+10, e.offsetY+50,newData);
            $("#editBlock").unbind("click");
        })
        
    });
    //导出数据
    jsPlumb.on(saveNodeBtn, "click", function(e) {
        exportData();
    });

    //
    // initialise element as connection targets and source.
    //初始化节点
    var initNode = function(el) {
        // initialise draggable elements.
        instance.draggable(el);

        instance.makeSource(el, {
            filter: ".ep",
            anchor: "Continuous",
            connectorStyle: { stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "transparent", outlineWidth: 4 },
            connectionType:"basic",
            extract:{
                "action":"the-action"
            },
            maxConnections: 10,
            onMaxConnections: function (info, e) {
                alert("Maximum connections (" + info.maxConnections + ") reached");
            }
        });

        instance.makeTarget(el, {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous",
            allowLoopback: false
        });
        //绑定双击节点的事件
        jsPlumb.on(canvasElement, "dblclick", function (el) {
            // var info = instance.getObjectInfo(this)
            var blockString = $("#"+el.target.id).find("input").val();
            var blockObj = JSON.parse(blockString);
            console.log(el.target.id,blockObj)
            $("#url").val(blockObj.url);
            $("#describe").val(blockObj.describe);
            $("#owner").val(blockObj.owner);
            if(blockObj.isSelfUpdate){
                $("#isSelfUpdate").prop("checked",true);
            };
            $("#myModalLabel").html("编辑节点");
            $("#deleteBlock").show();
            $("#myModal").modal('show');
            $("#editBlock").bind("click",function(){
                console.log(el.target.id)
                var newData = {};
                newData ={url:$("#url").val(),describe:$("#describe").val(),owner:$("#owner").val(),isSelfUpdate:$("#isSelfUpdate").prop("checked")}
                $("#"+el.target.id).find("input").val(JSON.stringify(newData));
                $("#editBlock").unbind("click");
            })
            $("#deleteBlock").bind("click",function(){
                instance.getConnections().forEach(function(ele){
                    if(ele.sourceId==el.target.id||ele.targetId==el.target.id){
                        instance.deleteConnection(ele)
                    }
                });
                el.target.remove();
                $("#deleteBlock").unbind("click");
            })            
            console.log(instance.getAllConnections(),instance.getConnections(el.target))        
        });
        // this is not part of the core demo functionality; it is a means for the Toolkit edition's wrapped
        // version of this demo to find out about new nodes being added.
        //
        instance.fire("jsPlumbDemoNodeAdded", el);
    };
    //导出的方法
    function exportData(){
        var blocksNode=[],blocksConnect = [];                          
        $(".w").each(function(idx, elem){
            var elem=$(elem);                           
            blocksNode.push({
                BlockId:elem.attr('id'),
                BlockContent:elem.text(),
                BlockX:parseInt(elem.css("left"), 10),
                BlockY:parseInt(elem.css("top"), 10),
                data:JSON.parse(elem.find("input").val())
            });
        });
        instance.getConnections().forEach(function(ele){
            blocksConnect.push({
                source: ele.sourceId, 
                target: ele.targetId,
                data:ele.getData().data,
                type:"basic"
            })
        });
        var blocks = [];
        blocks.push(blocksNode,blocksConnect)
        console.log(blocks)
        var serliza=JSON.stringify(blocks);
        console.log(serliza)
        //存储到server
        $("#outputText").html(serliza);
    }
    
    
    //新增节点的方法
    function newNode(id,name,x, y,data) {
        var d = document.createElement("div");
        if(!id){
            var id = "a"+jsPlumbUtil.uuid();
            var name = "content"
        }
        // var id = "a"+jsPlumbUtil.uuid();
        d.className = "w";
        d.id = id;
        d.innerHTML = data.describe + '<input type="hidden" value='+JSON.stringify(data)+'><div class=\"ep\"></div>';
        d.style.left = x + "px";
        d.style.top = y + "px";
        instance.getContainer().appendChild(d);
        initNode(d);
        return d;
    };


    
    window.setZoom = function (zoom, instance, transformOrigin, el) {
        transformOrigin = transformOrigin || [0.5, 0.5];
        instance = instance || jsPlumb;
        el = el || instance.getContainer();
        var p = ["webkit", "moz", "ms", "o"],
        s = "scale(" + zoom + ")",
        oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";
        for(var j=0;j<el.length;j++){
            for (var i = 0; i < p.length; i++) {
                el[j].style[p[i] + "Transform"] = s;
                el[j].style[p[i] + "TransformOrigin"] = oString;
            }
    
            el[j].style["transform"] = s;
            el[j].style["transformOrigin"] = oString;
        }
        

        instance.setZoom(zoom, true);
        instance.repaintEverything();
        
    };
    // var count = 0;
    // $('.jtk-demo-canvas').on('mousewheel', function(e, delta) {
        
    //     console.log(e.wheelDelta,count)
    //     var tep = 0.1;       
    //     var zoom = 1;
    //     if (delta ==1) {
    //         count++;
    //         setZoom(zoom+count*tep,instance,'',windows)
    //     } else {
    //         count--;
    //         setZoom(zoom+count*tep,instance,'',windows)
    //     }
    //     event.preventDefault();
        
    // });

    //数据渲染
    ;(function (){
        
        if(!unpack){
            return false;
        }
        unpack[0].map(function(value, index, array) {
            var _block = eval(value);
            newNode(_block.BlockId,_block.BlockContent, _block.BlockX, _block.BlockY,_block.data);
        });
        unpack[1].map(function(value, index, array) {
            var _block = eval(value);
            instance.connect({ source: _block.source, target: _block.target, type:"basic"});
        });
        // console.log(instance.getAllConnections())
        return true;
        // suspend drawing and initialise.
        
    })();
    jsPlumb.fire("jsPlumbDemoLoaded", instance);

});
