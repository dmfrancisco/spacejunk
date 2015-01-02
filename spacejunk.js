#!/usr/bin/env node

var  $tw = require("tiddlywiki/boot/boot.js").TiddlyWiki(),
 Dropbox = require("dropbox"),
    sync = require("synchronize"),
    exec = require('child_process').exec,
      fs = require("fs"),
    path = require("path");

// If the env var SPACEJUNK_LOCAL is set, run TiddlyWiki without Dropbox sync
if (process.env.SPACEJUNK_LOCAL == "true") {
  return require("tiddlywiki/tiddlywiki.js");
}

var config, appname, dropboxPath, tiddlersPathSuffix = "/tiddlers/";

try {
  config = require(path.join(process.cwd(), "config.json"));
} catch (e) {
  console.info("No custom configurations were found.");
  config = { "dropbox": {} };
}

// Create a volume with your credentials
var dropbox = new Dropbox.Client({
  key: (process.env.DROPBOX_KEY || config.dropbox.key),
  secret: (process.env.DROPBOX_SECRET || config.dropbox.secret),
  token: (process.env.DROPBOX_TOKEN || config.dropbox.token)
});

// Allow these functions to be called synchronously
sync(dropbox, 'readdir', 'readFile', 'stat');

function monkeypatch(object, f, callback) {
  object[f] = callback(object[f]);
}

// Checks if a local path should be mapped to a remote (dropbox) path
// @param {String} operation that will be performed (read, write or delete)
function shouldBeRemotePath(filepath, operation) {
  var isTiddlersPath = (filepath + "/").indexOf(tiddlersPathSuffix) != -1;

  switch (operation) {
    case "write":
    case "delete":
      // All visitors of the site can edit and delete tiddlers synced with Dropbox
      return isTiddlersPath;
    case "read":
      // If autosync is false, users will always see the last changes that were
      // manually synced with the Heroku server (through the Heroku Dashboard)
      return isTiddlersPath && !(process.env.SPACEJUNK_AUTOSYNC == "false" || config.autosync == false);
    default:
      return isTiddlersPath;
  }
}

// Converts the local path to the remote (dropbox) path
function toRemotePath(filepath) {
  return filepath.replace(process.cwd(), dropboxPath);
}

// Monkeypatch calls to the filesystem
// TODO Create a custom file sync adaptor for TW5 instead of monkeypatching
monkeypatch(fs, 'readdirSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath, "read")) {
      return dropbox.readdir(toRemotePath(filepath), { "httpCache": true });
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'readdir', function(original) {
  return function (filepath, callback) {
    if (shouldBeRemotePath(filepath, "read")) {
      return dropbox.readdir(toRemotePath(filepath), { "httpCache": true }, callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'readFileSync', function(original) {
  return function (filepath, options) {
    if (shouldBeRemotePath(filepath, "read")) {
      return dropbox.readFile(toRemotePath(filepath), { "httpCache": true });
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'writeFile', function(original) {
  return function(filepath, content, options, callback) {
    if (shouldBeRemotePath(filepath, "write")) {
      return dropbox.writeFile(toRemotePath(filepath), content, callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'unlink', function(original) {
  return function(filepath, callback) {
    if (shouldBeRemotePath(filepath, "delete")) {
      return dropbox.unlink(toRemotePath(filepath), callback);
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'existsSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath, "read")) {
      // Check if there is a file or folder with this name
      // TODO Use findByName instead?
      try { dropbox.stat(toRemotePath(filepath), { "httpCache": true }); return true; }
      catch (error) { return false; } // TODO Check error status
    } else {
      return original.apply(this, arguments);
    }
  };
});

monkeypatch(fs, 'statSync', function(original) {
  return function (filepath) {
    if (shouldBeRemotePath(filepath, "read")) {
      var metadata = dropbox.stat(toRemotePath(filepath), { "httpCache": true });
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
  // Path to where files are stored
  appname = process.env.APP_NAME || config.appname ||
    sync.await(exec("heroku config | head -1 | cut -d \" \" -f2", sync.defer())).trim();
  dropboxPath = process.env.DROPBOX_PATH || config.dropbox.path || ("/Apps/Heroku/"+ appname);

  console.info("Booting! Please wait...");

  // Boot the TW5 app
  $tw.boot.boot();

  // If autosync is off, make changes to Dropbox but don't update anything in the server
  if (process.env.SPACEJUNK_AUTOSYNC == "false" || config.autosync == false) {
    monkeypatch($tw.wiki, 'addTiddler', function(original) {
      return function (tiddler) {
        if (!(tiddler instanceof $tw.Tiddler)) {
          tiddler = new $tw.Tiddler(tiddler);
        }
        if (tiddler) {
          var title = tiddler.fields.title;
          if (title) {
            // tiddlers[title] = tiddler; this.clearCache(title); this.clearGlobalCache();
            this.enqueueTiddlerEvent(title);
          }
        }
      };
    });

    monkeypatch($tw.wiki, 'deleteTiddler', function(original) {
      return function (title) {
        // delete tiddlers[title]; this.clearCache(title); this.clearGlobalCache();
        this.enqueueTiddlerEvent(title, true);
      };
    });
  }

  console.info("Boot completed. TiddlyWiki is now serving the application.");
});
