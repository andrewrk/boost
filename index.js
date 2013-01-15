var jsdom = require("jsdom")
  , fs = require('fs')
  , Batch = require('batch')
  , juice = require('juice')
  , url = require('juice')
  , superagent = require('superagent')
  , assert = require('assert')
  , path = require('path')

module.exports = boostFile;
boostFile.boostContent = boostContent;

function boostContent(content, filename, cb) {
  extractCss(content, filename, function(err, html, css) {
    if (err) return cb(err);
    juiceWithCb(html, css, cb);
  });
}

function boostFile(filename, cb) {
  fs.readFile(filename, 'utf8', function(err, content) {
    if (err) {
      cb(err);
    } else {
      boostContent(content, filename, cb);
    }
  });
}

function juiceWithCb(html, css, cb) {
  try {
    cb(null, juice(html, css));
  } catch (err) {
    cb(err);
  }
}

function getStylesData(window, cb) {
  var results = [];
  var stylesList = window.document.getElementsByTagName("style");
  var i, styleDataList, styleData;
  for (i = 0; i < stylesList.length; ++i) {
    styleDataList = stylesList[i].childNodes;
    if (styleDataList.length !== 1) {
      cb(new Error("empty style element"));
      return;
    }
    styleData = styleDataList[0].data;
    results.push(styleData);
  }
  cb(null, results);
}

function getHrefContent(href, filename, cb) {
  var templatesHref = "file://" + path.resolve(process.cwd(), filename);
  var resolvedUrl = url.resolve(templatesHref, href);
  var parsedUrl = url.parse(resolvedUrl);
  if (parsedUrl.protocol === 'file:') {
    fs.readFile(parsedUrl.pathname, 'utf8', cb);
  } else {
    getRemoteContent(resolvedUrl, cb);
  }
}

function getRemoteContent(remoteUrl, cb) {
  superagent.get(remoteUrl).buffer().end(function(err, resp) {
    if (err) {
      cb(err);
    } else if (resp.ok) {
      cb(null, resp.text);
    } else {
      cb(new Error("GET " + remoteUrl + " " + resp.status));
    }
  });
}

function getStylesheetList(window) {
  var results = [];
  var linkList = window.document.getElementsByTagName("link");
  var link, i, j, attr, attrs;
  for (i = 0; i < linkList.length; ++i) {
    link = linkList[i];
    attrs = {};
    for (j = 0; j < link.attributes.length; ++j) {
      attr = link.attributes[j];
      attrs[attr.name.toLowerCase()] = attr.value.toLowerCase();
    }
    if (attrs.rel === 'stylesheet') results.push(attrs.href);
  }
  return results;
}

function extractCss(html, filename, cb) {
  jsdom.env(html, function(err, window) {
    if (err) return cb(err);
    var batch = new Batch();
    batch.push(function(cb) { getStylesData(window, cb); });
    getStylesheetList(window).forEach(function(stylesheetHref) {
      batch.push(function(cb) {
        getHrefContent(stylesheetHref, filename, cb);
      });
    });
    batch.end(function(err, results) {
      assert.ifError(err);
      var stylesData = results.shift();
      results.forEach(function(content) {
        stylesData.push(content);
      });
      var css = stylesData.join("\n");
      cb(null, html, css);
    });
  });
}
