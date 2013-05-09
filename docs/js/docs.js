/**
 * This code is only for the F2 documentation site. Don't use it anywhere else, you really shouldn't.
 *
 * (c) 2013 Markit On Demand
 *
 * https://github.com/OpenF2/F2#copyright-and-license
 */
if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

//F2 docs
var F2Docs = function(){ }

//shortcut
F2Docs.fn = F2Docs.prototype;
F2Docs.fn.NAV_BAR_COLLAPSE_WIDTH = 768;

/**
 * Init
 */
F2Docs.fn.init = function() {
	
	var win = $(window).width();
	//alert(win)

	//OLD
	//this.navbarDocsHelper();
	
	this.buildLeftRailToc();
	this.bindEvents();

	//this.buildBookmarks();
	
	this.formatSourceCodeElements();

	if (win > this.NAV_BAR_COLLAPSE_WIDTH){
		//affix & scrollspy left nav
		setTimeout(function(){
			
			$('#toc > ul.nav').affix({ offset: { top: 104, bottom: 250 } });
			$('body').scrollspy();

		},250);
	}


	//mobile nav
	this.mobileNav();
}

/**
 * Events
 */
F2Docs.fn.bindEvents = function(){
	this._setupBodyContentAnchorClick();
	this._watchScrollSpy();
}

/** 
 * Highlight Basics or Development nav item, based on filename
 */
F2Docs.fn.navbarDocsHelper = function(){
	var $toc 	= $('ul','div.navbar-docs')
		$collapsedNavToc = $('ul.navinset','div.navbar-inner'),
		file 	= location.pathname.split('/').pop(),
		urlMap 	= {
			'basics': 		'index.html',
			'development': 	'app-development.html',
			'developmentC': 'container-development.html',
			'developmentE': 'extending-f2.html',
			'developmentF':	'f2js-sdk.html'
		};

	//remove all 
	$toc.find('a').removeClass('active');

	//add active class to blue,green or orange subnav item
	if (file == urlMap.basics || !file){
		_setActive(0,$toc);
		_setActive(0,$collapsedNavToc);
		this.currentPage = 'basics';
	} else if (
			file == urlMap.development || 
			file == urlMap.developmentC || 
			file == urlMap.developmentE ||
			file == urlMap.developmentF
		){
		_setActive(1,$toc);
		_setActive(1,$collapsedNavToc);
		this.currentPage = 'development';
	}

	function _setActive(eq,$ul){
		$ul.find('li').eq(eq).find('a').addClass('active');
	}
}

/**
 * Mapping 
 * Don't reorder these without consequences in this._getCurrentSubSection()
 * Adding to them is fine.
 */
F2Docs.fn.subSections = {
	'About F2': 			'index.html',
	'App Development': 		'app-development.html',
	'Container Development':'container-development.html',
	'Extending F2': 		'extending-f2.html',
	'F2.js SDK': 			'f2js-sdk.html'
};

/**
 * Lookup in subSections for right URL
 */
F2Docs.fn._getCurrentSubSection = function(){
	var file = location.pathname.split('/').pop(),
		currSection,
		counter = 0;

	if (!file){
		file = this.subSections['About F2']; //=== index.html
	}

	$.each(this.subSections,$.proxy(function(idx,item){
		if (item == file) {
			currSection = counter;
		}
		counter++;
	},this));

	return currSection;
}

/**
 * Lookup in subSections NAME for insite
 */
F2Docs.fn._getCurrentSectionName = function(){
	var file = location.pathname.split('/').pop(),
		currSection,
		counter = 0;

	$.each(this.subSections,$.proxy(function(idx,item){
		if (item == file) {
			currSection = idx;
		}
		counter++;
	},this));

	return currSection;
}

F2Docs.fn.getName = function(){
	return this._getCurrentSectionName() || document.title.replace('F2 - ','');
}

/**
 * When on Development, we need some special nav.
 */
F2Docs.fn._buildSubSectionsHtml = function(){
	var html = [];

	$.each(this.subSections,function(idx,item){
		html.push("<li class='first'><a href='{url}' data-parent='true'>{label}</a></li>".supplant({url:item, label: idx}));
	});

	return html.join('');
}

/**
 * Add bookmark links to each <h1/2/3/4/5/6>
 */
F2Docs.fn.buildBookmarks = function(){
	var $docsContainer = $('#docs'),
		$headers = $('section', $docsContainer).not('.level1,.level2'),
		link = "<a href='#{id}' title='Permalink' name='{id}' class='docs-anchor'><span class='icon-bookmark'></span></a>";

	$headers.each($.proxy(function(idx,item){
		var $h = $(item).children().first(),
			//name = $h.text(),
			anchor = $(item).prop('id'),
			$link = $(link.supplant({id: anchor}));
			//animate click
			$link.on('click',$.proxy(function(e){
				this._animateAnchor(e,false);
			},this));
		$h.prepend($link);
	},this));
}

/**
 * Build left rail TOC
 */
F2Docs.fn.buildLeftRailToc = function(){

	var $toc 			= $('div.span12','div.navbar-docs'),
		$docsContainer 	= $('#docs'),
		//file 			= location.pathname.split('/').pop(),
		$sections 		= $('> section', $docsContainer),
		$sectionsL2		= $sections.filter('section.level2'),//find <section> elements in main content area
		$sectionsL3		= $sections.filter('section.level3'),
		$navWrap 		= $('<ul class="nav nav-tabs nav-stacked"></ul>'),
		listContainer	= [],
		$pageHeading	= $('h2','div.page-header');

	//build table of contents based on sections within generated markdown file
	if (!$sections.length) return;

	//quickly touch <h1> and add an ID attr. this regex removes all spaces and changes to dashes.
	$pageHeading.prop('id', $pageHeading.text().toLowerCase().replace(/\s+/g, '-'));

	//OK, add the sub-sections
	$navWrap.append(this._buildSubSectionsHtml());

	//loop over all sections, build nav based on <h2>'s inside the <section.level2>
	$sections.each($.proxy(function(idx,item){

		var $item = $(item),
			sectionTitle = $item.children().first().text(),
			sectionId = $item.prop('id'),
			isActive = (sectionId == String(location.hash.replace('#',''))) ? ' class="active"' : '',
			li;

		li = '<li{isActive}><a href="#{id}" data-id="{id}">{label}</a></li>'.supplant({id: sectionId, label: sectionTitle, isActive: isActive});

		listContainer.push(li);
	},this));

	var currentSubSection = this._getCurrentSubSection();

	//now, determine *where* to insert links. 
	// if they are Level2 
	if ($navWrap.find('li').length){
		$navWrap
			.find('li')
			.eq(currentSubSection)
			.addClass('first currentPage')
			.after(listContainer.join(''))
		;
	}

	//cache inner nav for this page
	var start = currentSubSection + 1, 
		end = start + listContainer.length;
	this.$currentSectionNavList = $navWrap.find('li').slice(start,end);

	//append links
	$('#toc').html($navWrap);

	var $responsiveItems = $navWrap.children().clone();
	$('ul', $responsiveItems).removeClass('nav-tabs').addClass('navinset');
	$('#tocResponsive').append($responsiveItems);

	//add click event
	$('a',$navWrap).on('click',$.proxy(function(e){
		this._animateAnchor(e,true);
	},this));
}

F2Docs.fn._setupBodyContentAnchorClick = function(){
	$('a[href^="#"]','#docs').on('click',$.proxy(function(e){
		this._animateAnchor(e,false);
	},this));
}

F2Docs.fn._animateAnchor = function(e, isTableOfContentsLink){
	var $this = $(e.currentTarget),
		destinationId = $this.attr('href').replace(".","\\\\."),
		$destination = $(destinationId),
		offset;

	//don't stop top-level (non-anchor) links from going to their location
	if (destinationId.indexOf('#') > -1){
		e.preventDefault();
	}

	if (isTableOfContentsLink){
		$('li.active', '#toc ul').removeClass('active');
		$this.parent().addClass('active');
	}

	//if we have a location.hash change, animate scrollTop to it.
	if (destinationId.indexOf('#') > -1){
		offset = $destination.offset() || {};
		$('html,body').animate({ scrollTop: offset.top },function(){
			location.hash = destinationId;
		});
		return false
	}
};

/**
 * Because of our page layout, bootstrap scrollspy doesn't pick up H1 
 * and the active class never gets added back when you scroll to top of page
 * This fixes that.
 */
F2Docs.fn._watchScrollSpy = function(){

	var $topL2 = $('section.level2').first(),
		pos = $topL2.offset().top,
		self = this;

	$(window).on('scroll',$.proxy(function(e){
		
		/*
		setTimeout(function(){
			console.log({
				test: document.body.scrollTop < pos, 
				scroll: document.body.scrollTop,
				top: pos,
				el: self.$currentSectionNavList.first().prop('class')
			})
		},500);*/

		if (document.body.scrollTop < pos){
			self.$currentSectionNavList.first().removeClass('active');
		}
	},this));
}

F2Docs.fn._getPgUrl = function (id) {
	if ('about-f2' == id){
		return this.subSections['About F2'];
	}
}

/**
 * Takes <pre><code>something();</code></pre> and converts to <pre>something();</pre>
 * Removes unneeded CSS classnames, adds correct ones for prettify.js
 * Calls prettyPrint()
 * Changes out mailto links that pandoc turns into <code> elements.
 */
F2Docs.fn.formatSourceCodeElements = function(){
	$('pre')
		.removeClass('sourceCode')
		.addClass('prettyprint linenums')
		.find('code').replaceWith(function() {
			return $(this).contents();
		})
		.end()
		.filter('.javascript')
		.removeClass('javascript')
		.addClass('lang-js')
		.end()
		.filter('.html')
		.removeClass('html')
		.addClass('lang-html')
	;
	window.prettyPrint && prettyPrint();

	//fix mailto links from pandoc so they don't have <code> around them.
	//pandoc supports a param to disable this, need to fix that in the build
	$('a[href^="mailto"]','#docs').each(function(idx,item){
		$(item)
			.html($(this).text())
			.prev('script').remove()
			.end()
			.next('noscript').remove()
		;
	});
}

F2Docs.fn.mobileNav = function() {

	$('#primary-nav').navobile({
		cta: '#show-navobile',
		changeDOM: true
	});
};

F2Docs.fn.insite = function(){
	if (F2.gitbranch() !== 'master') { return; }
	window._waq = window._waq || []; 
	(function() {
		var domain = 'insite.wallst.com'; 
		_waq.push(['_setup', {reportingid: '544506', domain: domain}]); 
		var wa = document.createElement('script'); 
		wa.type = 'text/javascript'; 
		wa.async = true; 
		wa.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + domain + '/js/wa.js'; 
		var s = document.getElementsByTagName('script')[0]; 
		s.parentNode.insertBefore(wa, s);
	})();
	//F2.log(this.getName())
	_waq.push(['_trackPageView', {category: 'Docs', name: this.getName() }]);
	_waq.push(['_trackLinks']);
}

/**
 * Let's do this.
 */
$(function() {
	console.group('F2Docs');
	F2Docs = new F2Docs();
	F2Docs.init();
	F2Docs.insite();
	console.groupEnd();
});
