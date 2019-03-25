$(function () {
  // 1. 获取个人信息
  lt.ajaxCheckLogin({
    type: 'get',
    url: '/user/queryUserMessage',
    data: '',
    success: function (data) {
      $('.mui-media-body').html(data.username + '<p class="mui-ellipsis">手机号：'+ data.mobile +'</p>');
    }
  });

  // 2. 退出登录
  $('.mui-btn-danger').on('tap',function () {
    $.ajax({
      type: 'get',
      url: '/user/logout',
      data: '',
      success: function (data) {
        if (data.success) {
          location.href =  '/mobile/user/login.html';
        }
      }
    });
  });
});