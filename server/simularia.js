var app=require("app-bp");
app.useDb('simularia');
var controller={
    name:"simularia",
    routes:{
        get:{
            '/index':'simularia.index@jinja:index',
            '/':'simularia.index@jinja:index'
        }
    },
    index : function () {
        this.renderer({});

    }
};



app.runControllers({
    simularia:controller
});
