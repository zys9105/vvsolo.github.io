//sEditor.setMode("ace/mode/novel");
$(function() {
	var isLanguage = $('#chinese'),
		tEditor = $('#TextareaEditor'),
		editorTitleHeight = 50

	// 简繁互换
	function setLanguage() {
		var tipVal = isLanguage.data('default').split('|')
		if (tipVal[0] == isLanguage.html()) {
			$('body').t2s();
			isLanguage.html(tipVal[1]);
		} else {
			$('body').s2t();
			isLanguage.html(tipVal[0]);
		}
	}
	// 提示信息
	function showMessage(r) {
		$('#AlertMsg').html($(r).attr('data-tip'))
		$('.editor-message').eq(0).hide().show().delay(5000).fadeOut(400)
	}
	// 编辑区域全屏占，修正编辑器高度
	function getEditorHeight() {
		editorTitleHeight = $('.editor-title').eq(0).outerHeight()
		tEditor.height(parseInt($(this).outerHeight() - editorTitleHeight))
	}
	getEditorHeight()
	$(window).resize(function() {
		getEditorHeight()
	});
	$('.editor-message').eq(0).delay(8000).fadeOut(400)
	// 初始化编辑器
	var editor = ace.edit("TextareaEditor")
	editor.setOptions({
		theme: "ace/theme/novel",
		mode: "ace/mode/novel",
		// 折行
		wrap: 'free',
		indentedSoftWrap: false,
		//autoScrollEditorIntoView: true,
		// 字体
		fontSize: 14,
		// 打印线
		printMarginColumn: 70,
		// 显示空格
		showInvisibles: true,
		// 显示滚动条
		//vScrollBarAlwaysVisible: true,
		// 空字符是否可复制
		copyWithEmptySelection: true,
		// 行号固定宽度
		fixedWidthGutter: true
	});
	// 状态栏
	var StatusBar = ace.require("ace/ext/statusbar").StatusBar;
	var statusBar = new StatusBar(editor, document.getElementById("statusBar"));
	var sEditor = editor.getSession()
	var storage = $.localStorage
	sEditor.setValue(storage.get('tmpContent') || '')
	isLanguage.html(storage.get('language') || '简')
	// 读取保存的设置
	var inputVals = ['inputBookName', 'inputChapter', 'inputAuthor', 'inputSite']
	for (var i = 0; i < inputVals.length; i++) {
		$('#' + inputVals[i]).val(storage.get(inputVals[i]) || '')
	}
	for (var i = 0; i < 5; i++) {
		var tmp = 'Check_' + i;
		$('#' + tmp).removeAttr('checked')
		if (!storage.isEmpty(tmp))
			$('#' + tmp).attr('checked', 'checked')
	}
	// 保存设置
	$('#SaveConfig').click(function() {
		for (var i = 0; i < inputVals.length; i++) {
			var tmp = inputVals[i]
			if ($('#' + tmp).val().length > 0)
				storage.set(tmp, $('#' + tmp).val())
			else
				storage.remove(tmp)
		}
		for (var i = 0; i < 5; i++) {
			var tmp = 'Check_' + i;
			if ($('#' + tmp).is(':checked'))
				storage.set(tmp, 'checked')
			else
				storage.remove(tmp)
		}
		storage.set('language', (isLanguage.html() == '简') ? '繁' : '简')
		showMessage(this)
	})
	// 简繁互换
	setLanguage()
	isLanguage.click(function(e) {
		e.preventDefault();
		setLanguage()
	});
	// 左侧收缩工具
	$('#floatTool').click(function() {
		var cLeft = $('#c-left').position().left === 0
		$('#c-left').animate({
			left: (cLeft ? -200 : 0)
		}, 300)
		$('#c-right').animate({
			left: (cLeft ? 0 : 200)
		}, 300)
		var tipVal = $(this).attr('data-tip').split('|')
		$(this).html(cLeft ? tipVal[0] : tipVal[1])
		
	})
	// 转简体
	$('#toSimp').on('click', function() {
		var sVal = sEditor.getValue()
		sVal = $.t2s(sVal)
		sEditor.setValue(sVal)
		editor.focus()
	})
	// 转繁体
	$('#toTrad').on('click', function() {
		var sVal = sEditor.getValue()
		sVal = $.s2t(sVal)
		sEditor.setValue(sVal)
		editor.focus()
	})
	// 实时显示文章标题
	setTitle()
	$('#inputBookName,#inputChapter').on('keyup keydown change focus input propertychange', function() {
		setTitle()
	})
	// 保存文档
	$('#SaveEditor').click(function() {
		var sVal = sEditor.getValue()
		if (sVal.length > 0) {
			storage.set('tmpContent', sVal)
			sEditor.getUndoManager().markClean();
			showMessage(this)
		}
		editor.focus()
	});
	editor.commands.addCommand({
		name: "__save",
		exec: function() {
			$('#SaveEditor').trigger('click')
		},
		bindKey: { win: "ctrl-s", mac: "cmd-s" }
	});
	// 还原文档
	$('#RestoreEditor').click(function() {
		var sVal = storage.get('tmpContent') || ''
		if (sVal.length > 0) {
			sEditor.setValue(sVal)
			editor.focus()
			showMessage(this)
		}
	});
	editor.commands.addCommand({
		name: "__restore",
		exec: function() {
			$('#RestoreEditor').trigger('click')
		},
		bindKey: { win: "ctrl-r", mac: "cmd-r" }
	});
	// 新建文档
	$('#CreateEditor').click(function() {
		sEditor.setValue('')
		editor.focus()
	});
	editor.commands.addCommand({
		name: "__create",
		exec: function() {
			$('#CreateEditor').trigger('click')
		},
		bindKey: { win: "ctrl-n", mac: "cmd-n" }
	});
	// 清空文档
	$('#ClearEditor').click(function() {
		storage.remove('tmpContent')
		showMessage(this)
		editor.focus()
	});
	// 一键整理
	$('#onCleanUp').click(function() {
		var sVal = sEditor.getValue()
		if (sVal.length > 0) {
			sVal = editorCleanUp(sVal)
			sEditor.setValue(sVal)
			editor.focus()
		}
	});
	editor.commands.addCommand({
		name: "__cleanup",
		exec: function() {
			$('#onCleanUp').trigger('click')
		},
		bindKey: { win: "f8", mac: "f8" }
	});
	// 一键排版
	$('#onTypeSet').click(function() {
		var sVal = sEditor.getValue()
		if (sVal.length > 0) {
			storage.set('tmpContent', sVal)
			showMessage(this)
			sEditor.setValue(doTidy(sVal))
			editor.focus()
		}
	});
	editor.commands.addCommand({
		name: "__typeset",
		exec: function() {
			$('#onTypeSet').trigger('click')
		},
		bindKey: { win: "f9", mac: "f9" }
	});
	// 绑定快捷键
	// 简单UBB
	$('.btn[data-ubbcode]').each(function() {
		var $this = $(this)
		$this.click(function() {
			var selection = sEditor.getTextRange(editor.getSelectionRange())
			if (selection.length > 0) {
				var tmp = $this.data('ubbcode').replace(/\{s\}/g, selection)
				editor.insert(tmp)
			} else {
				showMessage(this)
			}
		})
	});
	// 插入待续完结
	$('.btn[data-insert]').each(function() {
		var tmp = $(this).data('insert')
		$(this).click(function() {
			editor.insert(tmp)
		});
	});
	// 复制标题到剪贴板
	var clipboardTitle = new ClipboardJS('.copy-title')
	clipboardTitle.on('success', function(e) {
		e.clearSelection()
		showMessage($('.copy-title'))
	});
	// 复制文档到剪贴板
	var clipboardText = new ClipboardJS('.copy-content', {
		text: function(trigger) {
			return editor.getValue()
		}
	});
	clipboardText.on('success', function(e) {
		e.clearSelection()
		showMessage($('.copy-content'))
	});
	editor.commands.addCommand({
		name: "__copydoc",
		exec: function(){
			$('.copy-content').trigger('click')
		},
		bindKey: { win: "f10", mac: "f10" }
	});
});