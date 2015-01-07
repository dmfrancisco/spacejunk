/*\
title: $:/plugins/smart-time-ago/smart-time-ago.js
type: application/javascript
module-type: widget
\*/

(function() {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var ViewWidget = require("$:/core/modules/widgets/view.js").view;

  var SmartTimeAgoWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
  };

  /* Inherit from the base widget class */
  SmartTimeAgoWidget.prototype = new Widget();

  /* Render this widget into the DOM */
  SmartTimeAgoWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    // Create element
    var domNode = this.document.createElement("time");

    // Set attributes
    domNode.innerHTML = this.text;
    domNode.setAttribute("datetime", this.datetime);

    if (this.text != this.title) {
      domNode.setAttribute("title", this.title);
      domNode.className = "relative";
    }

    // Insert element
    parent.insertBefore(domNode,nextSibling);
    this.renderChildren(domNode,null);
    this.domNodes.push(domNode);
  };

  /* Compute the internal state of the widget */
  SmartTimeAgoWidget.prototype.execute = function() {
    this.viewTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    this.viewSubtiddler = this.getAttribute("subtiddler");
    this.viewField = this.getAttribute("field","text");
    this.viewIndex = this.getAttribute("index");

    var date = $tw.utils.parseDate(this.getValue());
    this.format = this.getAttribute("format", "");

    this.title = this.getValueAsDate(this.format);
    this.datetime = this.getValueAsDatetime(date);
    this.text = $tw.utils.getValueAsSmartDate(date, this.format);
  };

  SmartTimeAgoWidget.prototype.refresh = ViewWidget.prototype.refresh;
  SmartTimeAgoWidget.prototype.getValue = ViewWidget.prototype.getValue;
  SmartTimeAgoWidget.prototype.getValueAsDate = ViewWidget.prototype.getValueAsDate;

  SmartTimeAgoWidget.prototype.getValueAsDatetime = function(date) {
    if (date && $tw.utils.isDate(date) && date.toString() !== "Invalid Date") {
      return date.toISOString();
    } else {
      return "";
    }
  };

  $tw.utils.getValueAsSmartDate = function(date, format) {
    // Based on code from "JavaScript Pretty Date" by John Resig
    var diff = (((new Date()).getTime() - date.getTime()) / 1000),
      day_diff = Math.floor(diff / 86400);

    if (date && $tw.utils.isDate(date) && date.toString() !== "Invalid Date") {
      // Only show relative timestamps for dates that are at most one month away
      if (day_diff < 31) {
        return $tw.utils.getRelativeDate((new Date()) - (new Date(date))).description;
      } else {
        return $tw.utils.formatDateString(date, format);
      }
    } else {
      return "";
    }
  };

  exports["smart-time-ago"] = SmartTimeAgoWidget;

  /* Update them regularly */
  // TODO Improve this code (see git.io/IAkSmQ)
  if ($tw.browser) {
    setInterval(function() {
      var timetags = document.querySelectorAll("time.relative"), date;

      for (var i = 0; i < timetags.length; i++) {
        date = timetags[i].getAttribute("datetime");
        if (!date) { continue; }

        date = $tw.utils.getValueAsSmartDate(new Date(date), "");
        if (date) { timetags[i].innerHTML = date; }
      }
    }, 30000);
  }
})();
