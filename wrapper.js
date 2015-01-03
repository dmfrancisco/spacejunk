/*\
title: $:/plugins/markdown/wrapper.js
type: application/javascript
module-type: parser

Adds support for Markdown using Remarkable. Based on TW5-Mathdown by Victor Santos.
\*/

(function() {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  var Remarkable = require("$:/plugins/markdown/remarkable.js");

  var markdown = new Remarkable("full", {
    html: true,
    linkify: true,
    typographer: true
  });

  // Apply syntax highlighting to fenced code blocks if the highlight plugin is available
  try {
    var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs;

    markdown.set({
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (err) {}
        }

        try {
          return hljs.highlightAuto(str).value;
        } catch (err) {}

        return ''; // use external default escaping
      },
      langPrefix: "hljs language-"
    });
  } catch (err) {}

  var MarkdownParser = function(type, text, options) {
    var html = markdown.render(text);
    this.tree = [{ type: "raw", html: html }];
  };

  exports["text/x-markdown"] = MarkdownParser;

})();
