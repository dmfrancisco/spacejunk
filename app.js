#!/usr/bin/env node

var  $tw = require("tiddlywiki/boot/boot.js").TiddlyWiki(),
 Dropbox = require("dropbox"),
    sync = require("synchronize"),
      fs = require("fs"),
  config;

try {
  config = require("./config.json");
} catch (e) {
  console.log("No custom configurations were found.");
  config = { "dropbox": {} };
}

// Create a volume with your credentials
var dropbox = new Dropbox.Client({
  key: (process.env.DROPBOX_KEY || config.dropbox.key),
  secret: (process.env.DROPBOX_SECRET || config.dropbox.secret),
  token: (process.env.DROPBOX_TOKEN || config.dropbox.token)
});

// Path to where the files are stored
var appname = (process.env.APP_NAME || config.appname),
  tiddlersPathSuffix = "/tiddlers/",
  dropboxPath = process.env.DROPBOX_PATH || config.dropbox.path || ("/Apps/Heroku/"+ appname);

// Allow these functions to be called synchronously
sync(dropbox, 'readdir', 'readFile', 'stat');

function monkeypatch(object, f, callback) {
  object[f] = callback(object[f]);
}

// Checks if a local path should be mapped to a remote (dropbox) path
function shouldBeRemotePath(filepath) {
  return (filepath + "/").indexOf(tiddlersPathSuffix) != -1;
}

// Converts the local path to the remote (dropbox) path
function toRemotePath(filepath) {
  return filepath.replace(__dirname, dropboxPath);
}

// Monkeypatch calls to the filesystem
// TODO Create a custom file sync adaptor for TW5 instead of monkeypatching
monkeypatch(fs, 'readdirSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath)) {
      return dropbox.readdir(toRemotePath(filepath));
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'readdir', function(original) {
  return function (filepath, callback) {
    if (shouldBeRemotePath(filepath)) {
      return dropbox.readdir(toRemotePath(filepath), callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'readFileSync', function(original) {
  return function (filepath, options) {
    if (shouldBeRemotePath(filepath)) {
      return dropbox.readFile(toRemotePath(filepath));
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'writeFile', function(original) {
  return function(filepath, content, options, callback) {
    if (shouldBeRemotePath(filepath)) {
      return dropbox.writeFile(toRemotePath(filepath), content, callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'unlink', function(original) {
  return function(filepath, callback) {
    if (shouldBeRemotePath(filepath)) {
      return dropbox.unlink(toRemotePath(filepath), callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'existsSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath)) {
      // Check if there is a file or folder with this name
      // TODO Use findByName instead?
      try { dropbox.stat(toRemotePath(filepath)); return true; }
      catch (error) { return false; } // TODO Check error status
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'statSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath)) {
      var metadata = dropbox.stat(toRemotePath(filepath));
      metadata.isDirectory = function() { return this.isFolder; };
      metadata.isFile = function() { return this.isFile; };
      return metadata;
    } else {
      return original.apply(this, arguments);
    }
  };
});

// Pass the command line arguments to the boot kernel
$tw.boot.argv = Array.prototype.slice.call(process.argv, 2);

sync.fiber(function() {
  $tw.boot.boot(); // Boot the TW5 app
  console.log("Boot completed. TiddlyWiki is now serving the application.");
});
