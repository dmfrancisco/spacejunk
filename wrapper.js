/*\
title: $:/plugins/markdown/wrapper.js
type: application/javascript
module-type: parser

Adds support for Markdown using Marked.
Emojis by Twitter are licensed under CC-BY 4.0.
\*/

(function() {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  function override(object, f, callback) {
    object[f] = callback(object[f]);
  }

  var marked = require("$:/plugins/markdown/marked.js"),
    twemoji  = require("$:/plugins/markdown/twemoji.npm.js"),
    emojiMap = require("$:/plugins/markdown/emojimap.js"),
    emojiRe  = new RegExp(Object.keys(emojiMap).join("|"), "g"),
    renderer = new marked.Renderer();

  /* Set marked options (TODO Read this from config tiddler) */
  marked.setOptions({
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true
  });

  /* Apply syntax highlighting to fenced code blocks if the highlight plugin is available */
  try {
    var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs;

    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, code).value;
          } catch (err) {}
        }

        try {
          return hljs.highlightAuto(code).value;
        } catch (err) {}

        return ''; // use external default escaping
      },
      langPrefix: "hljs language-"
    });
  } catch (err) {}

  /* Add support for Emoji using Twemoji by Twitter */
  function parseEmoji(text) {
    // Map emoji codes to unicode characters
    var out = text.replace(emojiRe, function (matched) { return emojiMap[matched]; });

    // Map unicode characters to twitter emoji images
    return twemoji.parse(out, { size: 72 });
  }

  /* Based on code from ImageWidget */
  function localImageSrc(originalSrc, tiddler) {
    var type = tiddler.fields.type,
      text = tiddler.fields.text,
      canonical_uri = tiddler.fields._canonical_uri;

    if (text) {
      switch (type) {
        case "image/svg+xml":
          return "data:image/svg+xml," + encodeURIComponent(text);
        default:
          return "data:" + type + ";base64," + text;
      }
    } else if (canonical_uri) {
      return canonical_uri;
    }
    return originalSrc;
  }

  /* Add support for local image tiddlers */
  override(renderer, 'image', function(original) {
    return function (href, title, text) {
      var tiddler = $tw.wiki.getTiddler(href);

      if (tiddler && $tw.wiki.isImageTiddler(href)) {
        href = localImageSrc(href, tiddler);
      }
      return original.apply(this, [href, title, text]);
    };
  });

  var MarkdownParser = function(type, text, options) {
    var html = marked(parseEmoji(text));
    this.tree = [{ type: "raw", html: html }];
  };

  exports["text/x-markdown"] = MarkdownParser;

})();
