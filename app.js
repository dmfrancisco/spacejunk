#!/usr/bin/env node

var $tw = require("tiddlywiki/boot/boot.js").TiddlyWiki();

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv, 2);

// Boot the TW5 app
$tw.boot.boot();
