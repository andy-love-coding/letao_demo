$(function () {
  // 1. 下拉刷新 列表渲染
  // 2. 点击刷新按钮 触发 下拉刷新 列表渲染
  // 3. 删除操作
  // 4. 修改操作
  // 5. 计算总金额
  
  new App();
});
var App = function () {
  this.$cart = $('#cart');
  this.cartList = null; // 购车网的数据
  this.checkedArr = JSON.parse(localStorage.getItem('CheckedId')||'[]');
  this.init();
};

App.prototype = {
  init: function () {
    this.initRefresh();
    this.bindEvent();
  },
  initRefresh: function () {
    var that = this;
    mui.init({
      pullRefresh: {
        container: '.mui-scroll-wrapper',
        indicators: false,
        down: {
          auto: true,//可选,默认false.首次加载自动下拉刷新一次
          callback : function() {
            lt.ajaxCheckLogin({
              type: 'get',
              url: '/cart/queryCart',
              data: '',
              success: (data) => {
                // 从服务器得到数据，判断这些商品的id，有没有在checkedArr缓存数据中，有的话则给每个item添加 isChecked标记
                data.forEach(function(item,i) {
                  if (that.checkedArr.indexOf(item.id) >= 0) {
                    // 在数组中
                    data[i].isChecked = true;
                  }
                });

                that.cartList = data;
                that.render(data);
                that.calcAmount();
                // 停止下拉刷新
                // mui('.mui-scroll-wrapper').pullRefresh().endPulldownToRefresh();
                this.endPulldownToRefresh();
              }
            });            
          }
        }
      }
    });
  },
  render: function (data) {
    var that = this;
    // console.log(data);
    that.$cart.html(template('cartTpl', data));    
  },
  bindEvent: function () {
    var that = this;    
    // 绑定手动触发 下拉刷新事件
    $('.fa-refresh').on('tap', function () {
      // console.log(mui('.mui-scroll-wrapper').pullRefresh());  // 查看一下原型方法
      mui('.mui-scroll-wrapper').pullRefresh().pulldownLoading();
    });

    // 绑定 删除事件、修改事件、点击复选框事件
    that.$cart.on('tap', '.fa-trash', function () {
      that.delete(this); // 这里的this就是点击的删除元素(span icon)，是dom元素
    }).on('tap', '.fa-edit', function () {
      that.edit(this);
    }).on('change', '[type="checkbox"]', function () {
      var cart = that.cartList[this.dataset.index];
      cart.isChecked = $(this).prop('checked');
      // 如果选择，则放进缓存，否则从缓存中去除      
      if(cart.isChecked) {
        // 添加到数组
        var same = false;
        that.checkedArr.forEach(function(item,i) {
          if(cart.id == item) {
            same = true;
          }          
        });
        if(!same) {
          that.checkedArr.push(cart.id);
        }
      } else {
        // 重数组中去除
        that.checkedArr.forEach(function(item,i) {
          if(cart.id == item) {
            that.checkedArr.splice(i,1);
          }
        });
      }
      var checkedStr = JSON.stringify(that.checkedArr);
      localStorage.setItem('CheckedId', checkedStr);
      that.calcAmount();
    });

    // 绑定 编辑事件（操作尺码和数量）
    $('body').on('tap', '[data-size]', function () {
      $(this).addClass('now').siblings('span').removeClass('now');      
    }).on('tap', '.reduce', function () {
      var value = parseInt($('input.orderNum').val());
      if (value-1 >= 1) {
        $('input').val(value-1);
      }
    }).on('tap', '.plus', function () {
      var value = parseInt($('input.orderNum').val());
      var max = parseInt(this.dataset.max);
      if (value+1 <= max ) {
        $('input').val(value+1);
      }
    });

  },
  // 删除事件
  delete: function (btn) { // 这里的 btn 就是点击的删除元素(span icon)，是dom元素
    var that = this;
    // 1. 获取id
    var productId = btn.dataset.id;
    var index = btn.dataset.index;
    // 2. 删除确认
    mui.confirm('您是否确定删除该商品？', '温馨提示', ['否','是'], function (e) {
      if (e.index == 0) {
        // 否，不要删除，此时需：【关闭滑块 关闭li元素】
        mui.swipeoutClose(btn.parentNode.parentNode);
      } else {
        // 是，删除吧：从缓存 that.cartList 中删除再重新渲染        
        lt.ajaxCheckLogin({
          type: 'get',
          url: '/cart/deleteCart',
          data: {
            id: productId
          },
          success: function (data) {
            if (data.success) {
              mui.toast('删除成功！');
              that.cartList.splice(index,1);
              that.render(that.cartList);
              that.calcAmount();
            }
          }
        });
      }
    });
  },
  // 修改事件
  edit: function (btn) { // 这里的 btn 就是点击的编辑元素(span icon)，是dom元素
    var that = this;
    // 1. 获取要修改的id
    // 2. 通过id，在缓存中取到商品数据
    // 3. 弹窗，显示商品的内容（需动态渲染）
    // 4. 编辑：选择尺码、数量的操作
    // 5. 放弃编辑：关闭滑块
    // 6. 确认编辑：发送修改数据给后台
    // 7. 操作成功，修改列表数据，重新渲染
    var productId = btn.dataset.id;
    var productIndex = null;
    var productArr = this.cartList.filter(function(item,index) {
      if (item.id == productId) {
        productIndex = index;
        return true;
      }      
    });
    var product = productArr[0];
    // console.log(product,productIndex);
    var html = template('edit',product).replace(/\n/g, '');

    mui.confirm(html, '编辑商品', ['取消','确认'], function(e) {
      if (e.index == 0) {
        // 放弃编辑：【关闭滑块 关闭li元素】
        mui.swipeoutClose(btn.parentNode.parentNode);
      } else {
        // 确认编辑：
        var size = $('[data-size].now').data('size');
        var num = $('input.orderNum').val();
        $.ajax({
          type: 'post',
          url: '/cart/updateCart',
          data: {
            id: productId,
            size: size,
            num: num
          },
          success: function (data) {
            if (data.success==true) {
              mui.toast('修改成功！');
              // 修改页面内容
              that.cartList[productIndex].size = size;
              that.cartList[productIndex].num = num;
              that.render(that.cartList);
              that.calcAmount();          
            }
          }
        });
      }
    });
  },
  calcAmount: function (){
    // 四种情况需要计算金额：初始化、选择复选框、删除、修改数量
    // 计算业务
    var amount = 0;
    this.cartList.forEach(function (item, i) {
      if (item.isChecked) {
        amount += item.price * item.num;
      }
    });
    $('.lt_amount span').html(amount.toFixed(2));
  }
}