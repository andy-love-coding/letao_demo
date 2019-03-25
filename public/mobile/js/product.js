$(function () {
  // 1. 页面初始化时，触发下拉刷新，去加载数据渲染商品详情页面
  // 2. 主动下拉刷新，去加载数据渲染商品详情页面
  // 3. 交互功能：选择尺码 选择数量
  // 4. 点击加入购物车：发送请求给后台。（这里并不是实践中常用的购车车，而是相当提交订单，需要判断是否登录）
  // 4.1 响应 如果未登录，业务：跳转至登录页后再返回
  // 4.2 响应 如果已登录，加入成功，业务：弹窗提示，确认去购物车看看，还是放弃
  
  // 有上拉 下拉 就不需要初始化 区域滚动 了
  
  new App();
});

var App = function () {
  this.productId = lt.getParamsByUrl().productId;
  this.size = lt.getParamsByUrl().size;
  this.stockNum = 0; // 库存数量
  this.$productDetail = $('.mui-scroll');
  
  this.init();
}
App.prototype = {
  init: function () {
    this.initRefresh();
    this.bindEvent();
  },
  initRefresh: function () {
    var that = this;
    mui.init({
      pullRefresh: {
        container: ".mui-scroll-wrapper",
        indicators: false, //是否显示滚动条
        down : {
          auto: true,//可选,默认false.首次加载自动下拉刷新一次
          callback : function() {
            that.page = 1;          
            that.render(() =>{              
              // 停止下拉刷新
              this.endPulldownToRefresh();
            });
          }
        }
      }
    });
  },
  render: function (callback) {
    $.ajax({
      type: 'get',
      url: '/product/queryProductDetail',
      data: {
        id: this.productId
      },
      success: (data) => {
        // 模拟网络延时
        setTimeout(() => {
          // 刷新渲染
          data.currentSize = this.size;
          console.log(data);
          this.$productDetail.html(template('productDetail',data));
          this.stockNum = data.num;
          // 通过 js 渲染的轮播图，需要手动初始化一下
          mui('.mui-slider').slider({
            interval:3000//自动轮播周期，若为0则不自动播放，默认为0；
          });
          // 渲染后回调
          callback && callback();
        }, 1000);
      }
    });
  },
  bindEvent: function () {
    console.log('在异步渲染结束之前，就同步绑定事件了；但渲染结束之后，事件依然有效');
    var that = this;
    that.$productDetail.on('tap', '[data-size]', function () {
      $(this).addClass('now').siblings('span').removeClass('now');
      that.size = this.dataset.size;
      var newUrl = 'product.html?productId='+ that.productId +'&size='+this.dataset.size;
      history.replaceState(null,null,newUrl);
      // console.log(that.size);
    }).on('tap', '.reduce', function () {
      var value = parseInt($('input.orderNum').val());
      if (value-1 >= 1) {
        $('input').val(value-1);
      }
    }).on('tap', '.plus', function () {
      var value = parseInt($('input.orderNum').val());
      if (value+1 <= that.stockNum ) {
        $('input').val(value+1);
      }
    });

    $('.addCart').on('tap', function() {
      that.addCart();
    });
  },
  addCart: function () {
    // 加入购物车
    var data = {
      productId: this.productId,
      size: this.size,
      num: $('.orderNum').val()
    }
    if (!data.size) {
      mui.toast('请选择尺码');
      return; // 终止向下执行
    }
    // 提交数据：lt.ajaxCheckLogin({})，已经做了登录判断，没有登录会跳登录页，已经登录则正常执行原有的回调函数seccess
    lt.ajaxCheckLogin({
      type: 'post',
      url: '/cart/addCart',
      data: data,
      loginBefore: function () {}, // 自定义登录前的回调函数
      success: function (data) {
        // //（这里并不是实践中常用的购车车，而是相当提交订单，需要判断是否登录）
        // // 1. 是否登录，未登录提交购物车则 → 提示信息：{ error: 400, message: "未登录"}
        // if (data.error === 400) {
        //   // 未登录：跳转至登录页，并携带当前地址作为跳回来的参数
        //   location.href = '/mobile/user/login.html?returnUrl=' + encodeURIComponent(location.href);
        // } else {
        //   // 已登录，添加购物车成功，提示信息： {success: true}

        // }

        if(data.success = true) {
          // 已登录：添加购物车成功
          mui.confirm('添加成功，是否去购车网看看呢？', '温馨提示', ['否','是'], function (e) {
            if (e.index == 1) {
              location.href = '/mobile/user/cart.html';
            }
          });
        }
      }
    });
  },
 
}