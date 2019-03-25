$(function (){
  $('form').on('submit', function (e) {
    // form 表单默认会跳转，这里要做异步登录，需要阻止form 的默认跳转行为
    e.preventDefault();

    // 通过zepto的serialize()、serializeArray()方法，一次性获取表单内 表单元素的所有数据
    // serialize()获得的数据格式(字符串)：key=value&key1=value1
    // serializeArray()获得的数据格式(数组)：[{name: 'key', value: 'value'}, {name: 'key1', value: 'value1'}]
    // 这两种格式序列化数据，ajax都是支持的，可以ajax中直接使用
    var data = $(this).serializeArray();
    // 提交 ajax
    $.ajax({
      type: 'post',
      url: '/user/login',
      data: data,
      success: function (data) {
        if (data.success == true) {
          // 登录成功(账号：itcast；密码：111111)
          var returnUrl = lt.getParamsByUrl().returnUrl;
          if (returnUrl) {
            location.href = returnUrl;
          } else {
            location.href = '/mobile/user/index.html';
          }
        } else {
          // 登录失败
          mui.toast(data.message);
        }
      }
    });
  });
});