// zepto 入口函数
$(function () {
  // 所以实现了「下拉刷新、上拉加载」后，就不用再单独初始化区域滚动了
  // mui('.mui-scroll-wrapper').scroll({
  //   deceleration: 0.0005, //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
  //   indicators: false //是否显示滚动条
  // });

  // 1. 页面初始化时，触发下来刷新（获取第一页数据中：正在刷新中），渲染页面
  // 2. 主动触发下拉刷新（获取第一页数据：正在刷新中），渲染页面
  // 3. 主动触发上拉加载（获取下一页数据：正在加载中），追加到页面
  // 4. 点击搜索按钮，重新搜索，触发下来刷新（获取第一页数据中：正在刷新中），渲染页面
  // 5. 排序功能：请求后台数据，触发下来刷新（获取第一页数据中：正在刷新中），渲染页面

  new App();
  
});

var App = function () {
  this.proName = lt.getParamsByUrl().key || ''; // 获取地址栏搜索关键词
  this.page = 1; // 加载第几页的内容
  this.pageSize = 4;
  this.orderType = null;
  this.orderValue = null;
  this.$product = $('.lt_product'); // 产品容器
  this.$search = $('.lt_search'); // 搜索框容器
  this.$order = $('.lt_order'); // 排序容器
  this.KEY = 'key_search_keywords'; // 搜索记录存储的key：约定好 localstorage 的存储key
  this.list = JSON.parse(localStorage.getItem(this.KEY)||'[]'); // 获取搜索记录： 获取 localstorage 的数据
  this.init();
}; 

App.prototype = {
  init: function () {
    this.$search.find('input').val(this.proName);
    this.initRefresh();
    this.bindEvent();
  },
  // 初始化刷新方法
  initRefresh: function () {
    var that = this;
    // 「下拉刷新、上拉加载」，需要的dom结构，与区域滚动的结构一致，其本质在区域滚动的基础上做的封装
    // 所以实现了「下拉刷新、上拉加载」后，就不用再单独初始化区域滚动了
    mui.init({
      pullRefresh : {
        container: ".mui-scroll-wrapper",//下拉刷新容器标识，querySelector能定位的css选择器均可，比如：id、.class等
        indicators: false, //是否显示滚动条
        // 下拉刷新
        down : {
          height:50,//可选,默认50.触发下拉刷新拖动距离,
          auto: true,//可选,默认false.首次加载自动下拉刷新一次
          contentdown : "下拉可以刷新",//可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
          contentover : "释放立即刷新",//可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
          contentrefresh : "正在刷新...",//可选，正在刷新状态时，下拉刷新控件上显示的标题内容
          callback : function() { //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
            // 获取数据，异步渲染页面，异步之后，同步结束下拉刷新
            that.page = 1;          
            that.render((data) => {       
              // 刷新渲染
              that.$product.html(template('product',data));

              // 结束下拉刷新：注意官网写错了(endPulldown其实不存在)，其实结束刷新的方法是：endPulldownToRefresh
              // console.log(mui('.mui-scroll-wrapper').pullRefresh()); // 可打印一下对象，看看其原型方法中有哪些api方法
              // mui('.mui-scroll-wrapper').pullRefresh().endPulldownToRefresh();
              this.endPulldownToRefresh(); // this = mui('.mui-scroll-wrapper').pullRefresh()，指向组件对象
              // 启用上拉加载功能（又可以上拉加载了）
              this.refresh(true);
            });          
          } 
        },  
        // 上拉加载
        up : {
          height:50,//可选.默认50.触发上拉加载【拖动】距离
          auto:false,//可选,默认false.自动上拉加载一次
          contentrefresh : "正在加载...",//可选，正在加载状态时，上拉加载控件上显示的标题内容
          contentnomore:'没有更多数据了',//可选，请求完毕若没有更多数据时显示的提醒内容；
          callback: function ()  {
            that.page++;
            that.render((data) => {
              // 追加渲染
              var nomore = !data.data.length;
              if (!nomore) {
                that.$product.append(template('product',data));
              }
              // nomoe 为 ture 时，表示没有更多数据了，此时应该【禁用上拉加载功能】
              this.endPullupToRefresh(nomore); // this = mui('.mui-scroll-wrapper').pullRefresh()，指向组件对象
            });           
          }
        }
      }
    });
  },
  // 获取数据进行渲染
  render: function (callback) {
    // 1.获取数据
    // 2.渲染页面，异步渲染时，若有通过执行动作，通常用回调函数来执行
    var params = {
      proName: this.proName,
      page: this.page,
      pageSize: this.pageSize
    }
    if (this.orderType) {
      params[this.orderType] = this.orderValue;
    }
    $.ajax({
      tpye: '',
      url: '/product/queryProduct',
      data: params,
      success: (data) => {
        // 模拟网络延时
        setTimeout(() => {          
          callback && callback(data);
        }, 1000);
      }
    });
  },
  // 追加搜索历史
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
  // 绑定事件
  bindEvent: function () {
    var that = this;
    // 绑定搜索事件
    this.$search.on('tap', 'a', () => {
      // 1.获取 input 的数据
      var value = this.$search.find('input').val();
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

    // 绑定排序事件
    this.$order.on('tap', 'a', function() {
      // 修改样式：点击以选中的，则切换箭头朝向；点击为选中的，则把当前now移除并重置箭头，给当前加now
      if ($(this).hasClass('now')) {
        // 点击选中的：切换箭头方向
        if ($(this).find('span').hasClass('fa-angle-down')) {
          $(this).find('span').removeClass('fa-angle-down').addClass('fa-angle-up');
        } else {
          $(this).find('span').addClass('fa-angle-down').removeClass('fa-angle-up');
        }
      } else {
        // 点击未选中的
        $(this).parent().find('.fa-angle-up').removeClass('fa-angle-up').addClass('fa-angle-down');
        $(this).addClass('now').siblings().removeClass('now');
      }

      // 完成渲染
      // 排序参数：price 1升序 2降序；num 1升序 2降序
      that.orderType = this.dataset.type;
      that.orderValue = $(this).find('span').hasClass('fa-angle-down') ? 2 : 1;
      
      // 用 js 触发一次下拉刷新: 每一次排序，都需要请求一次服务器
      // console.log(mui('.mui-scroll-wrapper').pullRefresh());  // 查看一下原型方法
      mui('.mui-scroll-wrapper').pullRefresh().pulldownLoading();
    });
  }
};