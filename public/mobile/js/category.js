// zepto 入口函数
$(function () {
  // 1. 渲染一级分类
  // 2. 渲染第一个一级分类的二级分类
  // 3. 点击一级分类时，选中当前分类，渲染其对应的二级分类
  // 4. 返回上一次的页面
  // 5. 进入搜索中心页面
  new App();
});
var App = function () {
  this.$top = $('.cateLeft');
  this.$second = $('.cateRight');
  this.init();
};

/*
App.prototype.init = function () {};
App.prototype.renderTop = function () {};
这种单个添加方法到prototype原型中的方法，可以用对象的形式一次添加 App.prototype = {}
*/
App.prototype = {
  init: function () {
    var that = this;
    // 渲染一级分类
    this.renderTop(function(data) {
      // 根据一级分类的结果，渲染二级分类      
      that.renderSecond(data.rows[0].id);
    });
    this.bindEvent();
  },
  // 渲染一级分类
  renderTop: function (callback) {
    var that = this;
    // 1. 获取数据
    // 2. 完成渲染
    $.ajax({
      type: 'get',
      url: '/category/queryTopCategory', 
      data: '',
      success: function (data) {
        that.$top.html(template('top', data));
        // 当传入了回调函数，才会去调用回调函数（利用回调函数传递异步请求的数据）
        callback && callback(data);
      }
    });    
  },
  // 渲染二级分类
  renderSecond: function (id) {
    $.ajax({
      type: 'get',
      url: '/category/querySecondCategory',
      data: {
        id: id
      },
      success: (data) => { // es6 写法，会保持上级作用域中的 this 不变
        this.$second.html(template('second',data));
      }
    });
  },
  // 点击一级分类，选中当前分类，并渲染二级分类
  bindEvent: function() {
    var that = this;
    // 事件委派（委派给li下的a）
    // 这里“tap”是 mui 实现的，注意千万不要再在 zepto 中集成 touch 模块，否则会绑定两次tap
    this.$top.on('tap', 'li a', function() {
      var $a = $(this); // this 指向 a 元素
      $a.parent('li').addClass('now').siblings('li').removeClass('now');
      that.renderSecond(this.dataset.id);
    });
  }
};