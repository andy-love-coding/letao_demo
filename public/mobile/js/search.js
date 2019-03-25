// zepto 入口函数
$(function () {
  // 1. 根据当前存储的数据进行渲染
  // 2. 点击搜索框，获取搜索关键字，跳转去商品列表页，同时存储历史搜索
  // 2.1 没有重复的搜索，且不超过10条，正常追加
  // 2.2 没有重复的搜索，超过10条，追加一条新的，并去掉最早的一条
  // 2.3 有重复的搜索，追加一条新的，去掉旧的
  // 3. 删除单条搜索历史
  // 4. 清空所有搜索历史
  new App();
});
var App = function () {
  // 丰富属性
  this.$searchInput = $('.lt_search');
  this.$searchHistory = $('.lt_history');
  this.KEY = 'key_search_keywords'; // 约定好 localstorage 的存储key
  this.list = JSON.parse(localStorage.getItem(this.KEY)||'[]'); //获取 localstorage 的数据
  this.init();
};
// 丰富原型方法
App.prototype = {
  init: function () {
    this.$searchInput.find('input').val('');
    this.render();
    this.bindEvent();
  },
  render: function () {
    // 数据存储方式：localstorage
    // 由于 art-Template 不支持js外部函数，但是可以将外部函数当参数传入模板，再在模板中调用函数
    console.log(this.$searchHistory);
    this.$searchHistory.html(template('history', {list:this.list, ec: encodeURIComponent}));
  },
  delete: function (index) {
    // 删除
    this.list.splice(index,1);
    // 存储
    localStorage.setItem(this.KEY,JSON.stringify(this.list));
    // 渲染
    this.render();
  },
  clear: function () {
    // 删除
    this.list = [];
    // 存储
    localStorage.setItem(this.KEY,JSON.stringify(this.list));
    // 渲染
    this.render();
  },
  add: function (value) {
    var isSame = false;
    var sameIndex = null;
    this.list.forEach(function(element,i) {
      if (element === value) {
        isSame = true;
        sameIndex = i;
        return;
      }
    });
    if (isSame) {
      // 有重复：先删除，后追加
      this.list.splice(sameIndex,1);
    } else {
      // 没有重复
      if (this.list.length >= 10) {
        // 超过10条，先删除第一条，再追加
        this.list.splice(0,1);        
      }
    }
    // 追加
    this.list.push(value);
    // 存储
    localStorage.setItem(this.KEY,JSON.stringify(this.list));
  },
  bindEvent: function () {
    var that = this;
    this.$searchInput.on('tap', 'a' , () => {
      // 1.获取 input 的数据
      var value = this.$searchInput.find('input').val();
      console.log(value);
      // 2.校验数据
      if (!value) {
        // 友好提示
        mui.toast('请输入搜索关键字');
        // 终止执行
        return;        
      }
      // 3.跳转
      // 注意对【传参】进行URL编码，以过滤特殊字符的影响，如 & 、 = 等
      location.href = "/mobile/searchList.html?key="+encodeURIComponent(value);
      // 4.追加历史
      this.add(value);
    });

    // 链式绑定事件
    this.$searchHistory.on('tap', 'li span', function () {
      var index = this.dataset.index; // 事件绑定在 span 身上，所以 this 指的是 span
      that.delete(index);
    }).on('tap', '.tit a', function () {
      that.clear();
    });
  }
};