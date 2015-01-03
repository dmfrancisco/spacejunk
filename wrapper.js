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

  var MarkdownParser = function(type, text, options) {
    var html = markdown.render(text);
    this.tree = [{ type: "raw", html: html }];
  };

  exports["text/x-markdown"] = MarkdownParser;

})();
