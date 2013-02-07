var jsdom = require("jsdom")
  , fs = require('fs')
  , Batch = require('batch')
  , juiceDom = require('juice').juiceDom
  , url = require('url')
  , superagent = require('superagent')
  , assert = require('assert')
  , path = require('path')

module.exports = boostFile;
boostFile.boostContent = boostContent;
boostFile.boostDocument = boostDocument;

function boostDocument(document, filename, cb) {
  extractCssFromDocument(document, filename, function(err, css) {
    if (err) return cb(err);
      juiceWithCb(document, css, cb);
  });
}

function boostContent(content, filename, cb) {
  // hack to force jsdom to see this argument as html content, not a url
  // or a filename. https://github.com/tmpvar/jsdom/issues/554
  var html = content + "\n";
  var options = {
    features: {
      QuerySelector: ['1.0'],
      FetchExternalResources: false,
      ProcessExternalResources: false,
      MutationEvents: false,
    },
  };
  var document;
  try {
    document = jsdom.html(html, null, options);
  } catch (err) {
    cb(err);
    return;
  }
  boostDocument(document, filename, function(err) {
    if (err) return cb(err);
    var inner = document.innerHTML;
    document.parentWindow.close();
    cb(null, inner);
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

function juiceWithCb(dom, css, cb) {
  try {
    juiceDom(dom, css);
    cb();
  } catch (err) {
    cb(err);
  }
}

function getStylesData(document, cb) {
  var results = [];
  var stylesList = document.getElementsByTagName("style");
  var i, styleDataList, styleData, styleElement;
  for (i = 0; i < stylesList.length; ++i) {
    styleElement = stylesList[i];
    styleDataList = styleElement.childNodes;
    if (styleDataList.length !== 1) {
      cb(new Error("empty style element"));
      return;
    }
    styleData = styleDataList[0].data;
    results.push(styleData);
    styleElement.parentNode.removeChild(styleElement);
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

function getStylesheetList(document) {
  var results = [];
  var linkList = document.getElementsByTagName("link");
  var link, i, j, attr, attrs;
  for (i = 0; i < linkList.length; ++i) {
    link = linkList[i];
    attrs = {};
    for (j = 0; j < link.attributes.length; ++j) {
      attr = link.attributes[j];
      attrs[attr.name.toLowerCase()] = attr.value.toLowerCase();
    }
    if (attrs.rel === 'stylesheet') results.push(attrs.href);
    link.parentNode.removeChild(link);
  }
  return results;
}

function extractCssFromDocument(document, filename, cb) {
  var batch = new Batch();
  batch.push(function(cb) { getStylesData(document, cb); });
  getStylesheetList(document).forEach(function(stylesheetHref) {
    batch.push(function(cb) {
      getHrefContent(stylesheetHref, filename, cb);
    });
  });
  batch.end(function(err, results) {
    if (err) return cb(err);
    var stylesData = results.shift();
    results.forEach(function(content) {
      stylesData.push(content);
    });
    var css = stylesData.join("\n");
    cb(null, css);
  });
}
