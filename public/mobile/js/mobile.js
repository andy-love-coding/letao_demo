// 共用的函数

// 为了防止全局变量污染，我们把全局方法，定义在一个对象中，这样只用注意着一个变量就够了
if(!window.lt) {
  window.lt = {};
}

// 1.封装一个获取地址栏传参的方法
lt.getParamsByUrl = function () {
  // 把 ?name=andy&age=30 转换成 { name:"andy", age: "30" }
  var paramsObj = {};

  var search = location.search; // 获取 ? 号参数
  if (search) { // 如果?号参数存在
    search = search.replace(/^\?/, ''); // 去掉参数中的 ？
    if (search) { // 去掉?号后参数依然存在，格式：name=andy&age=30
      searchArr = search.split('&');
      searchArr.forEach(function(item,i) {
        // item = "key=value"
        itemArr = item.split('=');
        // itemArr = ["key","value"]
        paramsObj[itemArr[0]] = decodeURIComponent(itemArr[1]);
      });
    }
  }

  return paramsObj;
}

// 2. 登录拦截：基于zepto的ajax方法，重构success方法
lt.ajaxCheckLogin = function (params) {
  // params.success 修改一下，增加登录拦截业务
  var success = params.success; // 保留之前的成功回调函数
  params.success = function (data) { // 重构 params 中的success
    if(data.error ===400) {
      params.loginBefore && params.loginBefore(); // 登录前的回调函数
      location.href = '/mobile/user/login.html?returnUrl=' + encodeURIComponent(location.href);
    } else {
      success && success(data);
    }
  }
  $.ajax(params);
};