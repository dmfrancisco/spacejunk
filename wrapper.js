/*\
title: $:/plugins/padawanphysicist/TW5-Mathdown/wrapper.js
type: application/javascript
module-type: parser

Wraps up markdown parser for use in TiddlyWiki5

\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Remarkable = require("$:/plugins/padawanphysicist/TW5-Mathdown/remarkable.js");  // Markdown parser
var TeXZilla = require("$:/plugins/padawanphysicist/TW5-Mathdown/TeXZilla.js");      // (La)TeX-to-MathML converter
var CONFIG_DIALECT_TIDDLER = "$:/config/markdown/dialect", DEFAULT_DIALECT = "Full"; // Configuration tiddler and default option for Markdown dialect
var CONFIG_HTML_TIDDLER = "$:/config/markdown/html", DEFAULT_HTML = "true";          // Configuration tiddler and default option for inline HTML
var md; // Store markdown parser instance

/*
This function parse the equations, turning them into html tags
*/
function preParse(text) {
	var txt = text;

	if(!!txt) {
		// Displayed equation using \begin{equation} LaTeX environment \end{equation}
		var re = /([^\\]\\begin\{equation\}(?:\\.|[\s\S])*?\\end\{equation\})/gm;
		txt = txt.replace(re,function(match,text) {
			var tmp = text.replace("\\begin{equation}","").replace("\\end{equation}","").replace(/\r?\n|\r/g,"");
			var ml = TeXZilla.toMathMLString(tmp,true);

			return ml;
		});

		// Displayed equation using \[ square brackets \]
		var re = /([^\\]\\\[(?:\\.|[\s\S])*?\\\])/gm;
		txt = txt.replace(re,function(match,text) {
			var tmp = text.replace("\\[","").replace("\\]","").replace(/\r?\n|\r/g,"");
			var ml = TeXZilla.toMathMLString(tmp,true);

			return ml;
		});

		// Inline equation using $single dollars$
		var re = /(?:\$)([^\$\s]{0}[^\$]*?[^\$\\\s])(?:\$[^\$]{0})/gm;
		txt = txt.replace(re,function(match,text) {
			var ml = TeXZilla.toMathMLString(text,false);
			return ml;
		});
	}

	return txt;
}

var MarkdownParser = function(type,text,options) {
	var preParsedText,htmlText,markdownTree,node,
	    dialect   = options.wiki.getTiddlerText(CONFIG_DIALECT_TIDDLER,DEFAULT_DIALECT),
	    have_html = options.wiki.getTiddlerText(CONFIG_HTML_TIDDLER,DEFAULT_HTML);

	dialect   = dialect.replace(/(\r\n|\n|\r)/gm,"").toLowerCase();
	have_html = have_html.replace(/(\r\n|\n|\r)/gm,"").toLowerCase();

	md = new Remarkable(dialect);

	// Check for inline html
	if(have_html.match(/true/i)) md.set({html: true});

	// Parse additional rules before markdown (I hope this is just a workaround while learning how to insert rules properly on remarkable parser)
	preParsedText = preParse(text);
	// Parse Markdown
	htmlText = md.render(preParsedText);
	htmlText = htmlText.replace(/(\r\n|\n|\r)/gm,""); // Remove all newlines from html string before convert to 'json' array
	//console.log(htmlText);
	this.tree = [{type: "raw", html: htmlText}];
};

/*

[ 'html',
  [ 'p', 'something' ],
  [ 'h1',
    'heading and ',
    [ 'strong', 'other' ] ] ]

*/

exports["text/x-mathdown"] = MarkdownParser;

})();
