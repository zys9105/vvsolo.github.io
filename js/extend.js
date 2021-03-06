
function isType(type) {
	return function(obj) {
		return {}.toString.call(obj) == "[object " + type + "]";
	}
}
var isArray = isType("Array"),
	isString = isType("String"),
	isObject = isType("Object")

// 对象批量赋值
Object.extend = function(a, b) {
	for (var i in b) a[i] = b[i]
	return a
}

// 删除字符首尾空格 \uF604
var Space = "\x09\x0B\x0C\x20\u1680\u180E\u2000\u2001\u2002\u2003" +
	"\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000\u2028" +
	"\u2029\uE4C6\uF604\uF8F5\uE004\uF04A\uFEFF\u202e\u202c"
var allSpace = Space + '\x0A\x0D\xA0'
//var regEscape = /([\\`\*_\{\}\[\]\(\)\>\#\+\-\.\!])/g
var regEscape = /([.?*+^$[\]\\(){}|-])/g

// ***** 扩展字符处理 *****
Object.extend(String.prototype, {
	// 处理为正则字符串
	regEscape: function() {
		return this.replace(regEscape, "\\$1").replace(/\\+/g, "\\")
	},
	// 安全转换正则
	getReg: function(m) {
		return new RegExp(this.replace(/\\+/g, "\\"), m || 'g')
	},
	// 修正所有换行为 UNIX 标准
	toUNIX: function() {
		return String(this).replace(/\r\n|\n\r|\r/g, '\n')
	},
	// 格式化所有空格样式为标准
	space: function() {
		return String(this).replace(new RegExp('[' + Space + ']+', 'g'), ' ').toUNIX()
	},
	// 删除字符首尾空格
	trim: function() {
		return this.space().replace(/^[ 　]+/gm, '').replace(/[ 　]+$/gm, '')
	},
	// 去除所有空格后的长度
	checkEmpty: function() {
		return String(this).replace(new RegExp('[' + allSpace + ']', 'g'), '').length === 0
	},
	// 循环正则替换
	replaces: function(arr) {
		var re = this, i, dim
		for (i in arr) {
			dim = arr[i]
			// 如果是数组
			if (isArray(dim)) {
				// 判断是否正则
				isString(dim[0]) && (dim[0] = dim[0].getReg())
				re = re.replace(dim[0], dim[1] || '')
			}
			// 如果非数组并且是正则
			else {
				// 判断是否正则
				isString(dim) && (dim = dim.getReg())
				re = re.replace(dim, '')
			}
		}
		return re
	},
	// 字符串定位替换
	replaceAt: function(arr) {
		return this.replace( ('[' + arr[0] + ']').getReg(), function(m) {
			return arr[1].charAt(arr[0].indexOf(m))
		})
	},
	// 字符串定位数组替换
	replaceAtSplit: function(arr, tpl) {
		var t = isArray(arr[1]) ? arr[1] : arr[1].split('|')
		return this.replace( ('[' + arr[0] + ']').getReg(), function(m) {
			return tpl.fmt(t[arr[0].indexOf(m)] || '')
		})
	},
	// 取双字节与单字节混排时的真实字数
	len: function() {
		return this.replace(/[^\x00-\xff]/g, '**').length
	},
	// 按真实字数进行分隔
	realSubstring: function(start, len) {
		var str = this || ''
		if (str.length === 0) return str
		start = start || 0
		len = len || str.len()
		var byteL = 0, sub = ''
		for (var i = c = cl = 0; i < str.length; i++) {
			c = str.charCodeAt(i)
			cl = c > 0xff ? 2 : 1
			byteL += cl
			//还不到开始位
			if (start >= byteL) continue

			if (
				(len == str.len()) //取完
				||
				((len -= cl) >= 0) //取本字时不超过
			) {
				sub += String.fromCharCode(c)
			} else { //取超了
				break
			}
		}
		return sub
	},
	// 重复连接字符串
	times: function(m) {
		return m < 1 ? '' : new Array(m + 1).join(this);
	},
	// 取正则查询匹配的次数
	findCount: function(reg) {
		var re = this.match(reg)
		return (re !== null) ? re.length : 0;
	},
	// 用正则检查符号是否成对出现
	checkDouble: function (r) {
		var find = this.match(r),
			findlen = (find === null) ? 0 : find.length
		return ((findlen % 2) === 0)
	},
	// 正则字母大写
	matchUpper: function(reg) {
		return this.replace(reg, function(m) {
			return m.toUpperCase()
		})
	},
	// 正则字母小写
	matchLower: function(reg) {
		return this.replace(reg, function(m) {
			return m.toLowerCase()
		})
	},
	// 特殊方式替换字符串
	/*
	 * arrs = {name:"loogn",age:22,sex:['man', 'woman']}
	 * var result0 = "我是{$name}，{$sex.0}，今年{$age}了".fmt(arrs)
	 */
	fmt: function(args, r) {
		// 字符串时，直接替换任意标签
		if (isString(args))
			return this.replace(/\{\$zz\}/g, args);
		if (!isObject(args) && !isArray(args))
			return this;
		var re = this;
		// 数组连接符号
		r = r || ''
		// 特殊标记 /\{\$([a-z0-9\.]+)}/gi
		if (/\{\$[\w\.\-]+}/gi.test(re)) {
			re = re
				// 子项是数组{$name.t1.0}
				.replace(/\{\$([\w\-]+)\.([\d]{1,2}|[\w\.\-]{1,})\}/g, function(m, m1, m2) {
					// 如果子项是数组轮循
					if (/\./g.test(m2)) {
						return m.replace(('\{\$' + m1 + '\.').getReg(), '\{\$').fmt(args[m1], r)
					}
					var tmp = (args[m1] != null && args[m1][m2] != null) ? args[m1][m2] : m
					return isArray(tmp) ? tmp.join(r) : (tmp != null ? tmp : m)
				})
				// 子项
				.replace(/\{\$([\w\-]+)\}/g, function(m, m1) {
					var tmp = (args[m1] != null) ? args[m1] : m
					return isArray(tmp) ? tmp.join(r) : tmp
				})
		}
		return re;
	},
	// 替换并返回正则式
	fmtReg: function(args, f, r) {
		return this.fmt(args, r).getReg(f)
	}
});

// ***** 扩展数组处理 *****
Object.extend(Array.prototype, {
	// 随机取数组
	getRandom: function() {
		return isArray(this) ? this[Math.floor(Math.random() * (this.length))] : '';
	}
});

// ***** 扩展时间处理 *****
if(!Date.prototype.fmt) {
	// 格式化时间
	Date.prototype.fmt = function(d) {
		var o = {
			"M+": this.getMonth() + 1, //月份 
			"d+": this.getDate(), //日 
			"h+": this.getHours(), //小时 
			"m+": this.getMinutes(), //分 
			"s+": this.getSeconds(), //秒 
			"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
			"S": this.getMilliseconds() //毫秒 
		};
		if (/(y+)/.test(d))
			d = d.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		for (var k in o) {
			if (new RegExp("(" + k + ")").test(d))
				d = d.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
		return d;
	}
}

// 格式化数字 12,553.00
if (!Number.prototype.fmt) {
	Number.prototype.fmt = function() {
		// 验证输入的字符是否为数字
		if (isNaN(this)) return this
		return this.toLocaleString().replace(/\.00$/, '')
	}
}
