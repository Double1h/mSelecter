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
		// 传入的数据
		data: [],
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
	},
	
	initLayer: function() {
		// 获取scrollList
		var listHtml = '';
		this.option.data.forEach((item, index) => {
			listHtml += `<ul class="mSelecterItemList" data-index="${index}">`;
			
			item.forEach((item) => {
				listHtml +=	`<li class="mSelecterItem">${item.value}</li>`;
			});
			
			listHtml += `</ul>`;
		});
		
		// 整个选择器盒子
		var html = `<div class="mSelecter" id="mSelecter-${mSelecter.prototype.count}">
						<div class="mSelecterMask"></div>
						<div class="mSelecterBox">
							<div class="mSelecterHeader">
								<p class="close">取消</p>
								<p class="confirm">确定</p>
							</div>
							<div class="mSelecterContent">
								${listHtml}
								<div class="mSelectShowBox"></div>
							</div>
						</div>
					</div>`;
		
		// 插入到页面
		var el = $(html);
		$('body').append(el);
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
		// 给滚动列表设置高度
		this.wrap.find('.mSelecterContent').height(this.itemHeight * showItem);
		// 每个滚动列加padding，为了滚动的效果
		this.scrollList.css({
			'padding': this.itemHeight * Math.floor(showItem / 2) + "px 0",
		});
		// 选中框设置
		this.wrap.find('.mSelectShowBox').css('top', this.itemHeight * (showItem - 1 ) / 2);
		// 初始化选中
		this.initSelect(this.option.defaultSelect ? this.option.defaultSelect : []);
	},
	
	initSelect: function(result) {
		
		this.scrollList.forEach((item, index) => {
			if (result[index] == null) {
				result[index] = 0;
			}
			
			this.scrollList.eq(index).find(`li:nth-child(${result[index] + 1})`).addClass('active');
			this.setTranslateY(-result[index] * this.itemHeight, this.scrollList.eq(index));
			this.currentTranslateY.push(-result[index] * this.itemHeight);
		});
		this.currentItem = result;
	},
	
	initEvents: function() {
		this.el.off("click");
		this.el.on("click", () => {
			this.wrap.show();
		});
		
		this.scrollList.on("touchstart", (event) => {
			var index = event.currentTarget.dataset.index;
		    this.pointY = event.touches[0].pageY;
		    this.currentScrollList = this.scrollList.eq(index);
		    this.currentScrollListIndex = index;
		    
		    this.option.transition && this.initTransition();
			return false;
		});
		
		this.scrollList.on("touchmove", (event) => {
			var translateY = this.getTranslateY(event.touches[0].pageY);
			
			this.touchFeedback(translateY, "touchmove");
			return false;
		});
		
		this.scrollList.on("touchend", (event) => {
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
		this.currentItem[this.currentScrollListIndex] = Math.round(-this.currentTranslateY[this.currentScrollListIndex] / this.itemHeight);
		this.updateUi();
	},
	
	// 更新当前列的active
	updateUi: function() {
		this.currentScrollList.find('.mSelecterItem').removeClass('active');
		this.currentScrollList.find('.mSelecterItem').eq(this.currentItem[this.currentScrollListIndex]).addClass('active');
	},
	
	// 给回调函数传参
	getResult: function() {
		let result = [],
			tempResultItem = null;
			
		this.scrollList.forEach((item, index) => {
			// 当前列被选中项的index
			var selectedItem = this.currentItem[index],
				tempResultItem = selectedItem ? this.option.data[index][selectedItem] : this.option.data[index][0];
			
			result.push(tempResultItem);
		});
		
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
			
			!this.currentScrollList.bindTouchEnd && 
			this.currentScrollList.on("touchend", () => {
				this.currentScrollList.css({
					"transition": "all .3s"
				});
				this.currentScrollList.bindTouchEnd = true;
			});
	    }
	},
};


// 后期优化
// 改成原生？ todo or not to do is a question
