#!/usr/bin/env node

var  $tw = require("tiddlywiki/boot/boot.js").TiddlyWiki(),
 Dropbox = require("dropbox"),
   async = require("async"),
    path = $tw.node ? require("path") : null,
  config = {};

try {
  config = require("./config.json");
} catch (e) {
  console.log("No custom configurations were found.");
}

// Create a volume with your credentials
var client = new Dropbox.Client({
  key: (process.env.DROPBOX_KEY || config.dropbox.key),
  secret: (process.env.DROPBOX_SECRET || config.dropbox.secret),
  token: (process.env.DROPBOX_TOKEN || config.dropbox.token)
});

// Path to where the files are stored
var appname = (process.env.APP_NAME || config.appname),
  tiddlersPathSuffix = "/tiddlers/",
  dropboxPath = process.env.DROPBOX_PATH || config.dropbox.path || ("/Apps/Heroku/"+ appname);

function boot(files, dropboxData) {
  // Monkeypatch tiddler loader from TW5
  $tw.loadTiddlersFromFile = (function (original) {
    return function (filepath, fields) {
      var data,
        ext = path.extname(filepath),
        extensionInfo = $tw.config.fileExtensionInfo[ext],
        type = extensionInfo ? extensionInfo.type : null;

      if (filepath.indexOf(tiddlersPathSuffix) != -1) {
        var filename = filepath.split("/").pop(),
          index = files.indexOf(filename);
        data = dropboxData[index];
      }

      if (data) {
        // Data was retrieved from Dropbox
        var tiddlers = $tw.wiki.deserializeTiddlers(ext, data, fields);
        return { filepath: filepath, type: type, tiddlers: tiddlers, hasMetaFile: false };
      } else {
        // If this is not one of the user's tiddler files, or
        // the file was not synced with Dropbox yet, load it from server
        return original.apply(this, arguments);
      }
    };
  })($tw.loadTiddlersFromFile);

  // Boot the TW5 app
  $tw.boot.boot();
}

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv, 2);

// Read user's tiddlers from Dropbox and then boot TW5
client.readdir(dropboxPath + tiddlersPathSuffix, function (error, files) {
  if (error) {
    console.log(error); // Something went wrong.
  }

  var readFromDropbox = function (filename, callback) {
    return client.readFile(dropboxPath + tiddlersPathSuffix + filename, callback);
  };

  async.map(files, readFromDropbox, function (err, dropboxData) {
    boot(files, dropboxData);
  });
});
