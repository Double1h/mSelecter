'use strict';

var mSelecter = function mSelecter(option) {
	if (!option.el || typeof option.el !== 'string') {
		throw 'el must be string';
	}
	this.pointY = 0;
	// 每个scrollList的当前translateY
	this.currentTranslateY = [];
	// 每个scrollList中，当前被选中的item
	this.currentItem = [];
	// 当前滚动的列表
	this.currentScrollList = null;
	// 当前滚动列表的Index
	this.currentScrollListIndex = null;

	// 滚动列表们
	this.scrollList = null;
	this.confirm = null;
	this.close = null;
	// 包含整个插件的元素
	this.wrap = null;
	// 触发显示选择器的元素
	this.el = null;

	this.option = option;
	this.defaultOption = {
		// 显示几个item
		showItem: 5,
		// 是否显示动画效果
		transition: false,
		// 确定之后的回调
		callback: null,
		defaultSelect: [0],
		// 是否联动
		relation: false
	};

	// 每个item的高度
	this.itemHeight = null;
	// resize定时器
	this.resizedFinished = true;

	this.init();
};

mSelecter.prototype = {
	// 页面上的插件个数
	count: 0,
	init: function init() {
		this.initOption();
		this.initLayer();

		this.wrap = $('#mSelecter-' + mSelecter.prototype.count++);
		this.scrollList = this.wrap.find(".mSelecterItemList");
		this.confirm = this.wrap.find('.mSelecter .confirm');
		this.close = this.wrap.find('.mSelecter .close');
		this.el = $(this.option.el);

		this.registerMSelecter();
	},

	initOption: function initOption() {
		this.option = Object.assign(this.defaultOption, this.option || {});
		// 补足默认选项
		this.option.defaultSelect = this.getSelected();
	},

	getSelected: function getSelected() {
		var selected = this.option.defaultSelect,
		    lastChild = null;

		// 第一级的处理特殊一点
		if (typeof this.option.data[selected[0]] == 'undefined') {
			lastChild = this.option.data[0];
			selected[0] = 0;
		} else {
			lastChild = this.option.data[selected[0]];
		}

		// 先遍历selected， 如果selected选中的符合数据，则用selected
		// 否则， 删掉第一个不符合之后的所有默认选中
		for (var i = 1, length = selected.length; i < length; i++) {
			if (typeof lastChild.child !== 'undefined' && typeof lastChild.child[selected[i]] !== 'undefined') {
				lastChild = lastChild.child[selected[i]];
			} else {
				selected.length = i;
				break;
			}
		}

		// 除了默认选中,后面还有几列的,补上第一个元素为默认选中
		while (typeof lastChild != 'undefined' && typeof lastChild.child != 'undefined') {
			selected.push(0);
			lastChild = lastChild.child[0];
		}
		return selected;
	},

	initLayer: function initLayer() {
		// 获取scrollList
		var listHtml = '',
		    initData = this.getInitData(this.option.defaultSelect);

		initData.forEach(function (item, index) {
			listHtml += '<ul class="mSelecterItemList" data-index="' + index + '">';

			item.forEach(function (item) {
				listHtml += '<li class="mSelecterItem">' + item.value + '</li>';
			});

			listHtml += '</ul>';
		});

		// 整个选择器盒子
		var html = '<div class="mSelecter" id="mSelecter-' + mSelecter.prototype.count + '">\n\t\t\t\t\t\t<div class="mSelecterMask"></div>\n\t\t\t\t\t\t<div class="mSelecterBox">\n\t\t\t\t\t\t\t<div class="mSelecterHeader">\n\t\t\t\t\t\t\t\t<p class="close">\u53D6\u6D88</p>\n\t\t\t\t\t\t\t\t<p class="confirm">\u786E\u5B9A</p>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class="mSelecterContent">\n\t\t\t\t\t\t\t\t' + listHtml + '\n\t\t\t\t\t\t\t\t<div class="mSelectShowBox"></div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>';

		// 插入到页面
		var el = $(html);
		$('body').append(el);
	},

	updateLayer: function updateLayer() {
		var listHtml = '',
		    initData = this.getInitData(this.currentItem);

		initData.forEach(function (item, index) {
			listHtml += '<ul class="mSelecterItemList" data-index="' + index + '">';

			item.forEach(function (item) {
				listHtml += '<li class="mSelecterItem">' + item.value + '</li>';
			});

			listHtml += '</ul>';
		});

		listHtml += '<div class="mSelectShowBox"></div>';

		this.wrap.find('.mSelecterContent').html(listHtml);
	},

	getInitData: function getInitData(selected) {
		var result = [],
		    tempResult = [],
		    data = this.option.data;

		for (var i = 0, length = selected.length; i < length; i++) {
			tempResult = [];
			data = i === 0 ? data : data[selected[i - 1]].child;

			data.forEach(function (item, index) {
				tempResult.push({
					value: item.value,
					index: index
				});
			});

			result.push(tempResult);
		}

		return result;
	},

	registerMSelecter: function registerMSelecter() {
		var _this = this;

		this.wrap.hide();
		this.el.on("click", function () {
			_this.wrap.show();
			_this.initUi();
			_this.initEvents();
		});
	},

	initUi: function initUi() {
		var showItem = this.option.showItem;

		// 获取每个item的高度
		this.itemHeight = this.wrap.find('.mSelecterItem').height();
		// 给滚动列表设置高度
		this.wrap.find('.mSelecterContent').height(this.itemHeight * showItem);
		// 每个滚动列加padding，为了滚动的效果
		this.scrollList.css({
			'padding': this.itemHeight * Math.floor(showItem / 2) + "px 0"
		});
		// 选中框设置
		this.wrap.find('.mSelectShowBox').css('top', this.itemHeight * (showItem - 1) / 2);
		// 初始化选中
		this.initSelect(this.option.defaultSelect ? this.option.defaultSelect : []);
	},

	initSelect: function initSelect(result) {
		var _this2 = this;

		this.scrollList.forEach(function (item, index) {
			if (result[index] == null) {
				result[index] = 0;
			}

			_this2.scrollList.eq(index).find('li:nth-child(' + (result[index] + 1) + ')').addClass('active');
			_this2.setTranslateY(-result[index] * _this2.itemHeight, _this2.scrollList.eq(index));
			_this2.currentTranslateY.push(-result[index] * _this2.itemHeight);
		});
		this.currentItem = result;
	},

	initEvents: function initEvents() {
		var _this3 = this;

		this.el.off("click");
		this.el.on("click", function () {
			_this3.wrap.show();
		});

		this.wrap.find('.mSelecterContent').on("touchstart", ".mSelecterItemList", function (event) {
			var index = event.currentTarget.dataset.index;
			_this3.pointY = event.touches[0].pageY;
			_this3.currentScrollList = _this3.wrap.find('.mSelecterItemList').eq(index);
			_this3.currentScrollListIndex = index;

			_this3.option.transition && _this3.initTransition();
			return false;
		});

		this.wrap.find('.mSelecterContent').on("touchmove", ".mSelecterItemList", function (event) {
			var translateY = _this3.getTranslateY(event.touches[0].pageY);
			_this3.touchFeedback(translateY, "touchmove");
			return false;
		});

		this.wrap.find('.mSelecterContent').on("touchend", ".mSelecterItemList", function (event) {
			_this3.touchFeedback(_this3.fixedTranslateY(), "touchend");
			return false;
		});

		this.confirm.on("click", function () {
			var result = _this3.getResult();
			typeof _this3.option.callback == 'function' && _this3.option.callback(result);
			_this3.wrap.hide();
		});

		this.close.on("click", function () {
			_this3.wrap.hide();
		});

		$(window).on("resize", function () {
			clearTimeout(_this3.resizedFinished);
			_this3.resizedFinished = setTimeout(function () {
				_this3.initUi();
			}, 300);
		});
	},

	// 获取每次触摸的位移
	getTranslateY: function getTranslateY(currentPointY) {
		var distance = this.pointY - currentPointY,
		    // 当次触碰的位移, >0 向上  <0 向下
		tempCurrentTranslateY = this.currentTranslateY[this.currentScrollListIndex] || 0,
		    // 该列本身的translateY
		translateY = tempCurrentTranslateY - distance,
		    // 累计本身的位移，计算 （向上是-， 向下是+）
		height = this.itemHeight * (this.currentScrollList.find('.mSelecterItem').length - 1); // 最多可以移动的位移
		// 边界判断
		if (translateY > 0) {
			translateY = 0;
		} else if (translateY < 0 && translateY < -height) {
			translateY = -height;
		}

		this.currentTranslateY[this.currentScrollListIndex] = translateY;
		this.pointY = currentPointY;
		return translateY;
	},

	// 触摸结束后，校准位移， 把偏差归位
	fixedTranslateY: function fixedTranslateY() {
		var count = Math.round(this.currentTranslateY[this.currentScrollListIndex] / this.itemHeight);
		return count * this.itemHeight;
	},

	setTranslateY: function setTranslateY(translateY, el) {
		if (typeof el == 'undefined') {
			el = this.currentScrollList;
		}
		el.css({
			'transform': 'translateY(' + translateY + 'px)'
		});
	},

	// 设置translateY, 更新当前选中item, 及Ui
	touchFeedback: function touchFeedback(translateY, eventType) {
		this.setTranslateY(translateY);
		// 设置当前滚动列表被选中的项的index
		this.currentItem[this.currentScrollListIndex] = parseInt(Math.round(-this.currentTranslateY[this.currentScrollListIndex] / this.itemHeight));
		// 结束时要重置其后的选项
		if (eventType === 'touchend') {
			this.updateCurrentItem(this.currentScrollListIndex);
			this.updateLayer();
			this.updateUi();
		}
		this.updateUi2();
	},

	// 更新选中
	updateCurrentItem: function updateCurrentItem(index) {
		var currentItem = this.currentItem,
		    index = parseInt(index),
		    lastChild = this.option.data[currentItem[0]];

		// 获取当前最后一列值
		currentItem.length = index + 1;
		for (var i = 1; i <= index; i++) {
			lastChild = lastChild.child[currentItem[i]];
		}

		// 补充其后的值
		while (lastChild && lastChild.child && lastChild.child[0]) {
			lastChild = lastChild.child[0];
			currentItem[++index] = 0;
		}
	},
	// 更新当前列的active
	updateUi: function updateUi() {
		var _this4 = this;

		this.wrap.find('.mSelectShowBox').css('top', this.itemHeight * (this.option.showItem - 1) / 2);
		this.wrap.find('.mSelecterItem').removeClass('active');
		this.wrap.find('.mSelecterItemList').css({
			'padding': this.itemHeight * Math.floor(this.option.showItem / 2) + "px 0"
		});
		this.currentItem.forEach(function (item, index) {
			_this4.wrap.find('.mSelecterItemList').eq(index).find('.mSelecterItem').eq(item).addClass('active');
			_this4.wrap.find('.mSelecterItemList').eq(index).css({
				'transform': 'translateY(' + -(_this4.itemHeight * item) + 'px)'
			});
		});
	},

	updateUi2: function updateUi2() {
		this.currentScrollList.find('.mSelecterItem').removeClass('active');
		this.currentScrollList.find('.mSelecterItem').eq(this.currentItem[this.currentScrollListIndex]).addClass('active');
	},

	// 给回调函数传参
	getResult: function getResult() {
		var result = [],
		    currentItem = this.currentItem,
		    lastChild = this.option.data[currentItem[0]];
		result.push(lastChild);

		// 获取当前最后一列值
		for (var i = 1; i < currentItem.length; i++) {
			lastChild = lastChild.child[currentItem[i]];
			result.push(lastChild);
		}

		return result;
	},

	// 获取数组中，属性值等于给定值的下标
	getArrayAttrIndex: function getArrayAttrIndex(obj) {
		var attr = obj.attr,
		    value = obj.value,
		    array = obj.array;

		for (var i = 0, length = array.length; i < length; i++) {
			if (array[i][attr] === value) {
				return i;
			}
		}
		return -1;
	},

	// touchstart时 初始化当前滚动列的transition
	initTransition: function initTransition() {
		var _this5 = this;

		if (this.option.transition) {
			this.currentScrollList.css({
				"transition": "initial"
			});

			!this.currentScrollList.bindTouchEnd && this.currentScrollList.on("touchend", function () {
				_this5.currentScrollList.css({
					"transition": "all .3s"
				});
				_this5.currentScrollList.bindTouchEnd = true;
			});
		}
	}
};

// 后期优化
// 改成原生？ todo or not to do is a question