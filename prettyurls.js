/*\
title: $:/plugins/prettyurls/prettyurls.js
type: application/javascript
module-type: storyview
\*/
(function() {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  if ($tw.browser) {

    // Default story and history lists
    var DEFAULT_STORY_TITLE = "$:/StoryList";
    var DEFAULT_HISTORY_TITLE = "$:/HistoryList";

    // Config
    var CONFIG_UPDATE_ADDRESS_BAR = "$:/config/Navigation/UpdateAddressBar"; // Can be "no", "permalink", "permaview"
    var CONFIG_UPDATE_HISTORY = "$:/config/Navigation/UpdateHistory"; // Can be "yes" or "no"

    var prettyHash = function(text) {
      return text.replace(/\s/g, '+').replace(/\$\:\//g, "$_/");
    };

    var updateLocationHash = function(options) {
      var locationHash;

      if (options.updateAddressBar !== "no") {
        // Get the story and the history stack
        var storyList = $tw.wiki.getTiddlerList(DEFAULT_STORY_TITLE),
          historyList = $tw.wiki.getTiddlerData(DEFAULT_HISTORY_TITLE,[]),
          targetTiddler = "";
        if (options.targetTiddler) {
          targetTiddler = options.targetTiddler;
        } else {
          // The target tiddler is the one at the top of the stack
          if(historyList.length > 0) {
            targetTiddler = historyList[historyList.length-1].title;
          }
          // Blank the target tiddler if it isn't present in the story
          if(storyList.indexOf(targetTiddler) === -1) {
            targetTiddler = "";
          }
        }

        // Assemble the location hash
        if (options.updateAddressBar === "permalink") {
          locationHash = "#" + prettyHash(targetTiddler);
        } else {
          locationHash = "#" + prettyHash(targetTiddler) + ":" + prettyHash($tw.utils.stringifyList(storyList));
        }

        // Only change the location hash if we must, thus avoiding unnecessary onhashchange events
        if (window.location.hash !== locationHash) {
          if (options.updateHistory === "yes") {
            // Assign the location hash so that history is updated
            window.location.hash = locationHash;
          } else {
            // We use replace so that browser history isn't affected
            window.location.replace(window.location.toString().split("#")[0] + locationHash);
          }
        }
      }
    };

    $tw.wiki.addEventListener("change", function(changes) {
      if ($tw.utils.hop(changes, DEFAULT_STORY_TITLE) || $tw.utils.hop(changes, DEFAULT_HISTORY_TITLE)) {
        updateLocationHash({
          updateAddressBar: $tw.wiki.getTiddlerText(CONFIG_UPDATE_ADDRESS_BAR, "permaview").trim(),
          updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY, "no").trim()
        });
      }
    });

    $tw.rootWidget.addEventListener("tm-permalink", function(event) {
      updateLocationHash({
        updateAddressBar: "permalink",
        updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY, "no").trim(),
        targetTiddler: event.param || event.tiddlerTitle
      });
    });

    $tw.rootWidget.addEventListener("tm-permaview", function(event) {
      updateLocationHash({
        updateAddressBar: "permaview",
        updateHistory: $tw.wiki.getTiddlerText(CONFIG_UPDATE_HISTORY, "no").trim(),
        targetTiddler: event.param || event.tiddlerTitle
      });
    });

    Object.defineProperty($tw.utils, "getLocationHash", {
      get: function() {
        return function() {
          return $tw.locationHash;
        };
      }
    });
  }
})();
