var mSelecter = function (option){
	if(!option.el || typeof option.el !== 'string') {
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
	// 当前滚动列表移动前选中项的Index
	this.beforeScrollCurrentItemIndex = null;

	// 滚动列表们
	this.scrollList = null;
	// 滚动列表对应的Html（缓存起来）
	this.scrollListHtml = [];
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
		relation: false,
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
	init: function() {
		this.initOption();
		this.initLayer();
		
		this.wrap = $('#mSelecter-' + mSelecter.prototype.count++);
		this.scrollList = this.wrap.find(".mSelecterItemList");
		this.confirm = this.wrap.find('.mSelecter .confirm');
		this.close = this.wrap.find('.mSelecter .close');
		this.el = $(this.option.el);
		
		this.registerMSelecter();
	},
	
	initOption: function() {
		this.option = Object.assign(this.defaultOption, this.option || {});
		// 处理传进来的默认选项, 设置当前选项
		this.currentItem = this.getSelected();
	},
	
	// 处理传进来的默认选项
	getSelected: function () {
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
		for(var i = 1, length = selected.length; i < length; i++) {
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
	
	initLayer: function() {
		// 获取scrollList
		var listHtml = '';
		
		this.updateScrollListHtml();
		listHtml = this.scrollListHtml.join('');
		
		// 整个选择器盒子
		var html = `<div class="mSelecter" id="mSelecter-${mSelecter.prototype.count}">
						<div class="mSelecterMask"></div>
						<div class="mSelecterBox">
							<div class="mSelecterHeader">
								<p class="close">取消</p>
								<p class="confirm">确定</p>
							</div>
							<div class="mSelecterContent">
								<div class="mSelecterList">
									${listHtml}
								</div>
								<div class="mSelectShowBox"></div>
							</div>
						</div>
					</div>`;
		
		// 插入到页面
		var el = $(html);
		$('body').append(el);
	},
	
	updateLayer: function(fromIndex) {
		var listHtml = '',
			originScrollListHtml = this.scrollListHtml.join('');
			
		this.updateScrollListHtml(fromIndex);
		listHtml = this.scrollListHtml.join('');
		
		// 相同的话 不操作dom
		if (originScrollListHtml === listHtml) return ;
		this.wrap.find('.mSelecterList').html(listHtml);
	},
	
	// 更新scrollList的html
	updateScrollListHtml: function(fromIndex) {
		var from = typeof fromIndex == 'undefined' ? 0 : parseInt(fromIndex) + 1,
			// 初始化页面上显示的数据 (整理成二维数组， 每一列的数据是一个数组项)
			initData = this.getInitData(),
			listHtml = '';
			
		this.scrollListHtml.length = from;
		for(var i = from, length = initData.length; i < length; i++) {
			var item = initData[i];
			listHtml = `<ul class="mSelecterItemList" data-index="${i}">`;
			
			item.forEach((item) => {
				listHtml +=	`<li class="mSelecterItem">${item.value}</li>`;
			});
			
			listHtml += `</ul>`;
			this.scrollListHtml.push(listHtml);
		}
	},
	
	// 根据选中项提取每一列的数据，整理成二维数组
	getInitData: function() {
		var result = [],
			tempResult = [],
			data = this.option.data,
			selected = this.currentItem || [];
		
		for(var i = 0, length = selected.length; i < length; i++) {
			tempResult = [];
			data = i === 0 ? data : data[selected[i-1]].child;
			
			data.forEach((item, index) => {
				tempResult.push({
					value: item.value,
					index: index,
				});
			});
			
			result.push(tempResult);
		}
		
		return result;
	},
	
	registerMSelecter: function() {
		this.wrap.hide();
		this.el.on("click", ()=> {
			this.wrap.show();
			this.initUi();
			this.initEvents();
		});
	},
	
	initUi: function() {
		var showItem = this.option.showItem;
			
		// 获取每个item的高度
		this.itemHeight = this.wrap.find('.mSelecterItem').height();
		// 给滚动列表的外层盒子设置高度
		this.wrap.find('.mSelecterContent').height(this.itemHeight * showItem);
		// 每个滚动列加padding（辅助滚动，使能选中最顶 || 最底元素）
		this.scrollList.css({
			'padding': this.itemHeight * Math.floor(showItem / 2) + "px 0",
			'width': (100 / this.scrollList.length).toFixed(2) + "%"
		});
		// 选中框位置设置
		this.wrap.find('.mSelectShowBox').css('top', this.itemHeight * (showItem - 1 ) / 2);
		// 初始化选中UI & 相关数据
		this.initSelect(this.currentItem ? this.currentItem : []);
	},
	
	initSelect: function(result) {
		this.scrollList.forEach((item, index) => {
			if (result[index] == null) {
				result[index] = 0;
			}
			
			// 高亮
			this.scrollList.eq(index).find(`li:nth-child(${result[index] + 1})`).addClass('active');
			// 滚动到选中位置
			this.setTranslateY(-result[index] * this.itemHeight, this.scrollList.eq(index));
			// 存储当前滚动列的滚动高度，方便后面滚动计算
			this.currentTranslateY.push(-result[index] * this.itemHeight);
		});
		// 存储当前选中项，方便后面计算
		this.currentItem = result;
	},
	
	initEvents: function() {
		// 去掉初始化事件，重新绑定
		this.el.off("click");
		this.el.on("click", () => {
			this.wrap.show();
		});
		
		
		this.wrap.find('.mSelecterList').on("touchstart", ".mSelecterItemList", (event) => {
			var index = event.currentTarget.dataset.index;
		    this.pointY = event.touches[0].pageY;
		    this.currentScrollList = this.wrap.find('.mSelecterItemList').eq(index);
		    this.currentScrollListIndex = index;
		    this.beforeScrollCurrentItemIndex = this.currentItem[this.currentScrollListIndex];
		    
		    this.option.transition && this.initTransition();
			return false;
		});
		
		this.wrap.find('.mSelecterList').on("touchmove", ".mSelecterItemList", (event) => {
			var translateY = this.getTranslateY(event.touches[0].pageY);
			this.touchFeedback(translateY, "touchmove");
			return false;
		});
		
		this.wrap.find('.mSelecterList').on("touchend", ".mSelecterItemList", (event) => {
			this.touchFeedback(this.fixedTranslateY(), "touchend");
			return false;
		});
		
		this.confirm.on("click", () => {
			var result = this.getResult();
			typeof this.option.callback == 'function' && this.option.callback(result);
			this.wrap.hide();
		});
		
		this.close.on("click", () => {
			this.wrap.hide();
		});
		
		$(window).on("resize", () => {
			clearTimeout(this.resizedFinished);
		    this.resizedFinished = setTimeout(() => {
		        this.initUi();
		    }, 300);
		});
	},
	
	// 获取每次触摸的位移
	getTranslateY: function(currentPointY) {
		var distance = this.pointY - currentPointY, // 当次触碰的位移, >0 向上  <0 向下
			tempCurrentTranslateY = this.currentTranslateY[this.currentScrollListIndex] || 0, // 该列本身的translateY
			translateY = tempCurrentTranslateY - distance, // 累计本身的位移，计算 （向上是-， 向下是+）
			height = this.itemHeight * (this.currentScrollList.find('.mSelecterItem').length - 1); // 最多可以移动的位移

		// 边界判断
		if(translateY > 0) {
			translateY = 0;
		} else if (translateY < 0 && translateY < -height) {
			translateY = -height;
		}
		
		this.currentTranslateY[this.currentScrollListIndex] = translateY;
		this.pointY = currentPointY;
		return translateY;
	},
	
	// 触摸结束后，校准位移， 把偏差归位
	fixedTranslateY: function() {
		var count = Math.round(this.currentTranslateY[this.currentScrollListIndex] / this.itemHeight);
		return count * this.itemHeight;
	},
	
	setTranslateY: function(translateY, el) {
		if(typeof el == 'undefined') {
			el = this.currentScrollList;
		}
		el.css({
			'transform': 'translateY(' + translateY + 'px)',
		});
	},
	
	// 设置translateY, 更新当前选中item, 及Ui
	touchFeedback: function(translateY, eventType) {
		this.setTranslateY(translateY);
		// 设置当前滚动列表被选中的项的index
		this.currentItem[this.currentScrollListIndex] = parseInt(Math.round(-this.currentTranslateY[this.currentScrollListIndex] / this.itemHeight));
		// 结束时 && 当前滚动列的值改变了，要重置其后的选项
		if (eventType === 'touchend' && this.currentItem[this.currentScrollListIndex] != this.beforeScrollCurrentItemIndex) {
			this.updateCurrentItem(this.currentScrollListIndex);
			this.updateLayer(this.currentScrollListIndex);
			this.updateTouchEndUi(this.currentScrollListIndex);
		} else {
			this.updateTouchMoveUi();
		}
	},
	
	// 更新选中数组
	updateCurrentItem: function(index) {
		var currentItem = this.currentItem,
			index = parseInt(index),
			lastChild = this.option.data[currentItem[0]];
		
		// 获取当前最后一列值
		currentItem.length = index + 1;
		for(var i = 1; i <= index; i++) {
			lastChild = lastChild.child[currentItem[i]];
		}
		
		// 补充其后的值
		while(lastChild && lastChild.child && lastChild.child[0]) {
			lastChild = lastChild.child[0];
			currentItem[++index] = 0;
		}
	},
	// 更新当前列的active
	updateTouchEndUi: function() {
		var mSelecterItemList = this.wrap.find('.mSelecterItemList'),
			currentItemList = null;
			
		for (var i = 0, length = mSelecterItemList.length; i < length; i++) {
			currentItemList = mSelecterItemList.eq(i);
			// 加上active
			currentItemList.find('.mSelecterItem').eq(this.currentItem[i]).addClass('active');
			// 加上位移
			currentItemList.css({
				'padding': this.itemHeight * Math.floor(this.option.showItem / 2) + "px 0",
				'transform': 'translateY(' + -(this.itemHeight * this.currentItem[i]) + 'px)',
			});
		}
		
		setTimeout(() => {
			mSelecterItemList.css({
				'width': (100 / length).toFixed(2) + "%"
			});
		}, 0);
		
	},
	
	updateTouchMoveUi: function() {
		this.currentScrollList.find('.mSelecterItem').removeClass('active');
		this.currentScrollList.find('.mSelecterItem').eq(this.currentItem[this.currentScrollListIndex]).addClass('active');
	},
	
	// 给回调函数传参
	getResult: function() {
		let result = [],
			currentItem = this.currentItem,
			lastChild = this.option.data[currentItem[0]];
		result.push(lastChild);
			
		// 获取当前最后一列值
		for(var i = 1; i < currentItem.length; i++) {
			lastChild = lastChild.child[currentItem[i]];
			result.push(lastChild);
		}
		
		return result;
	},
	
	// 获取数组中，属性值等于给定值的下标
	getArrayAttrIndex: function(obj) {
		var {attr, value, array} = obj;
		for(var i = 0, length = array.length; i < length; i++) {
			if(array[i][attr] === value) {
				return i;
			}
		}
		return -1;
	},
	
	// touchstart时 初始化当前滚动列的transition
	initTransition: function() {
		if (this.option.transition) {
	    	this.currentScrollList.css({
				"transition": "initial"
			});
			
			this.wrap.find('.mSelecterList').on("touchend", ".mSelecterItemList", function() {
				$(this).css({
					"transition": "all .3s"
				});
			});
	    }
	},
};


// 后期优化
// 兼容不联调
// 改成类 es6
