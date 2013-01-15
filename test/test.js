var boost = require('../')
  , path = require('path')
  , fs = require('fs')
  , Batch = require('batch')
  , assert = require('assert')

var testMap = {
  "no_css": true,
};
describe("boost", function() {
  for (var testName in testMap) {
    it(testName, createIt(testName));
  }
  
  function createIt(templateName) {
    return function(cb) {
      var batch = new Batch();
      batch.push(function(cb) {
        fs.readFile(path.join(__dirname, "html", testName + ".out.html"), 'utf8', cb);
      });
      batch.push(function(cb) {
        boost(path.join(__dirname, "html", testName + ".in.html"), cb);
      });
      batch.end(function(err, results) {
        if (err) return cb(err);
        assert.strictEqual(results[0], results[1]);
        cb();
      });
    };
  }
});
