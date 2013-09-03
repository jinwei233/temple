var fs = require("fs");
var parser = require("../lib/parser");
var jit = require("../lib/jit");
var result
// result = parser.parse("{ varname }");
// console.log(result[0])

// result = parser.parse("{#if a > 1 }yes{#else}no{/if}");
// console.log(result[0])

// result = parser.parse("hi{ name }{ sex }");
// console.log(result[0])


// result = parser.parse(fs.readFileSync("./templates/if0.txt").toString());
// console.log(result[0])

// result = parser.parse(fs.readFileSync("./templates/if1.txt").toString());
// console.log(result[0])


// result = parser.parse(fs.readFileSync("./templates/if2.txt").toString());
// console.log(result[0])

// result = parser.parse(fs.readFileSync("./templates/if0.txt").toString());
// console.log(result[0])

// result = parser.parse("(a + (b - c ))");
// result = parser.parse("(a + (2 + c))");
// result = parser.parse("a * (b + (c/d))");
// result = parser.parse("(a * 2)");
// result = parser.parse("(a)");
// result = parser.parse("(a+1)");
// console.log(result[0])


// 字符串
// result = parser.parse("'a'");
// result = parser.parse("'\\'\"a'");
// result = parser.parse('"a bcd\'\\""');
// result = parser.parse('"a\\""');
// result = parser.parse("\\'");
// console.log(result[0])


result = parser.parse(fs.readFileSync("./templates/simple.txt").toString());
var ast = [];
var next = result[0].next;
function gen(next,prev,list){
  next.name && console.log(next.name);
  // console.log(list);
  var name = next.name;
  if(name == "@ifend" || name == "@ifexpend" || name == "@ifbodyend" || name == "@elseifend" || name == "@elseend"){
    list = prev;
  }else if(next.name == "@eachstart"){
    var eachclause = ["each"];
    list.push(eachclause);
    prev = list;
    list = eachclause;
  }else if(next.name == "@each-head-start"){
    var eachComprehension = [];
    var eachBracket = [eachComprehension];
    list.push(eachBracket);
    prev = list;
    list = eachComprehension;
  }else if(next.name == "@each-body-start"){
    var eachBody = [];
    list.push(eachBody);
    prev = list;
    list = eachBody;
  }else if(next.name == "each-items"){
    list.push(next.value);
  }else if(next.name == "each-item"){
    list.push(next.value);
  }else if(next.name == "each-index"){
    list.push(next.value);
  }else if(next.name == "@ifstart"){
    var ifexpressions = [];
    var ifclause = ["if",ifexpressions];
    list.push(ifclause);
    prev = list;
    list = ifclause;
  }else if(next.name == "@elseifstart"){
    var ifexpression = [];
    list.push(ifexpression);
    prev = list;
    list = ifexpression;
  }else if(next.name == "@ifexpstart"){
    var predict = [];
    list.push(predict);
    prev = list;
    list = predict;
  }else if(next.name == "@ifbodystart"){
    var yesexp = [];
    list.push(yesexp);
    prev = list;
    list = yesexp;
  }else if(next.name == "expression"){
    list.push(next.value);
  }else if(next.name == "number"){
    list.push(["number",next.value]);
  }else if(next.name == "string"){
    if(next.value == "\n"){
      list.push(["string",'"\\n"']);
    }else{
      var strs = next.value.split("\n");
      for(var i=0,l = strs.length;i<l;i++){
        if(strs[i]){
          list.push(["string",'"\\n"']);
          list.push(["string",strs[i]]);
        }
      }
    }
  }
  next = next.next;
  next && gen(next,prev,list);
}
//gen(next,null,ast);

function gen(next,currentContext,ctxq){
  // next.name && console.log(next.name);
  // console.log("ctxq.length=",ctxq.length);
  var name = next.name;
  if(name == "@ifend" || name == "@ifbodyend" || name == "@elseifend" || name == "@elseend"){
    if(ctxq.length){
      currentContext = ctxq.pop();
    }
  }else if(next.name == "@eachstart"){
    var eachclause = ["each"];
    currentContext.push(eachclause);
    ctxq.push(currentContext);
    currentContext = eachclause;
  }else if(next.name == "@each-head-start"){
    var eachComprehension = [];
    currentContext.push(eachComprehension);
    ctxq.push(currentContext);
    currentContext = eachComprehension;
  }else if(next.name == "@each-body-start"){
    currentContext = ctxq.pop();

    var eachBody = [];
    currentContext.push(eachBody);
    ctxq.push(currentContext);
    currentContext = eachBody;
  }else if(next.name == "each-items"){
    currentContext.push(next.value);
  }else if(next.name == "each-item"){
    currentContext.push(next.value);
  }else if(next.name == "each-index"){
    currentContext.push(next.value);
  }else if(next.name == "@ifstart"){
    var ifexpressions = [];
    var ifclause = ["if",ifexpressions];
    currentContext.push(ifclause);
    //存储两级context
    ctxq.push(currentContext);
    ctxq.push(ifclause);
    currentContext = ifexpressions;
  }else if(next.name == "@elseifstart"){
    var ifexpression = [];
    currentContext.push(ifexpression);
    ctxq.push(currentContext);
    currentContext = ifexpression;
  }else if(next.name == "@ifexpstart"){
    var predict = [];
    currentContext.push(predict);
    ctxq.push(currentContext);
    currentContext = predict;
  }else if(name == "@elsestart"){
    currentContext = ctxq.pop();
    var elseexp = [];
    currentContext.push(elseexp);
    ctxq.push(currentContext);
    currentContext = elseexp;
  }else if(name == "@ifexpend"){
    if(ctxq.length){
      currentContext = ctxq.pop();
    }
  }else if(next.name == "@ifbodystart"){
    var yesexp = [];
    currentContext.push(yesexp);
    ctxq.push(currentContext);
    currentContext = yesexp;
  }else if(next.name == "expression"){
    currentContext.push(next.value);
  }else if(next.name == "var"){
    currentContext.push(["var",next.value]);
  }else if(next.name == "number"){
    currentContext.push(["number",next.value]);
  }else if(next.name == "string"){
    if(next.value == "\n"){
      currentContext.push(["string",'\\n']);
    }else{
      var strs = next.value.split("\n");
      for(var i=0,l = strs.length;i<l;i++){
        if(strs[i]){
          currentContext.push(["string",'\\n']);
          currentContext.push(["string",strs[i]]);
        }
      }
    }
  }
  next = next.next;
  next && gen(next,currentContext,ctxq);
}
gen(next,ast,[]);
// console.log(JSON.stringify(ast))
console.log(jit.to_js(ast));
var tpl = jit.compile(ast);
var ret = tpl.render({name:"tom"});
console.log(ret);

