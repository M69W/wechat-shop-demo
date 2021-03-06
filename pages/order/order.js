// pages/order/order.js
var ZanTab = require('../../style/zanui/tab/index');
var app = getApp();

Page(Object.assign({}, ZanTab, {
  data: {
    tab: {
      list: app.Constants.orderTabList,
      selectedId: 'all',
      scroll: false,
      height: 45
    },
    orderStatusTipMap: app.Constants.orderStatusTipMap,
    goodsOrderList: [],
    page: 1,
    loadmore: false,
    isLastPage: false
  },

  onLoad(option) {
    var status = option.status

    wx.setNavigationBarTitle({
      title: '订单'
    })
    this.setData({
      'tab.selectedId': status
    })
    this.getOrderList();
  },

  //获取订单列表
  getOrderList(cb) {
    var that = this;
    var params = app.Http.buildParams()
    params.body.queryFilter = app.Http.buildFilter({ params: { status: this.data.tab.selectedId }, page: this.data.page })
    app.Http.request('queryOrderBill.do', params, function (res) {
      var data = JSON.parse(res)
      var result = that.data.goodsOrderList.concat(data.values)

      if (that.data.page === data.pageCount) {
        that.setData({
          isLastPage: true
        })
      }

      that.setData({
        goodsOrderList: result,
        loadmore: false,
      })

      return typeof cb === "function" && cb()
    })
  },
  //取消订单
  cancelOrderBill(e) {
    var that = this;

    wx.showModal({
      title: '提示',
      content: '狠心取消订单？',
      success: function (res) {
        if (res.confirm) {
          var order = e.currentTarget.dataset.order;
          var params = app.Http.buildParams()
          params.body = {
            uuid: order.uuid,
            version: order.version
          }
          app.Http.request('cancelOrderBill.do', params, function (res) {
            wx.showToast({ title: '取消订单成功', icon: 'success', duration: 2000 })
            that.getOrderList();
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  //再次购买
  orderAgain(e) {
    var orderUuid = e.currentTarget.dataset.orderUuid;

    this.getOrder(orderUuid, function(order) {
      var orderLines = order.lines
      app.orderAgain(orderLines)
    })
  },
  //获取订单信息
  getOrder(orderUuid, cb) {
    var that = this;
    var params = app.Http.buildParams()
    params.body.uuid = orderUuid
    app.Http.request('getOrderBillByUuid.do', params, function (res) {
      return typeof cb === "function" && cb(JSON.parse(res) || null)
    })
  },
  //切换tab
  handleZanTabChange(e) {
    var componentId = e.componentId;
    var selectedId = e.selectedId;

    this.setData({
      [`${componentId}.selectedId`]: selectedId
    });
    this.reset();
    this.getOrderList();
  },
  //滚动
  handleScrollOrderContentToLower(e) {
    if (!this.data.isLastPage && !this.data.loadmore) {
      this.setData({
        page: ++this.data.page,
        loadmore: true
      })
      this.getOrderList();
    }
  },
  //重置请求参数
  reset() {
    this.setData({
      goodsOrderList: [],
      page: 1,
      loadmore: false,
      isLastPage: false
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    this.reset();
    this.getOrderList(function () {
      wx.stopPullDownRefresh()
    });
  }
}));