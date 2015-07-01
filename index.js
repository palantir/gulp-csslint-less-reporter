/*
 * gulp-csslint-less-reporter (https://github.com/palantir/gulp-csslint-less-reporter)
 *
 * Copyright 2015 Palantir Technologies, Inc.
 *
 * Licensed under MIT (https://github.com/palantir/gulp-csslint-less-reporter/blob/master/LICENSE)
 */

'use strict';

var path = require('path');

var globule = require('globule');
var gutil = require('gulp-util');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var through = require('through2');

var colors = gutil.colors;

var pluginName = 'gulp-csslint-less-reporter';

module.exports = function lessReporter(importsFilter) {
  var allErrors = [];

  var reportErrors = function reportErrors(file, enc, callback) {
    if (!file.csslint || file.csslint.success) {
      return callback(null, file);
    }

    var origFilePath = path.resolve(gutil.replaceExtension(file.path, '.less'));

    if (!file.sourceMap) {
      return callback(new gutil.PluginError(
        pluginName,
        'Source map not found for file: ' + origFilePath));
    }

    var sourceMap = new SourceMapConsumer(file.sourceMap);

    // resolve original lines and filter to relevant files
    var mappedResults = file.csslint.results.map(function (result) {
      var message = result.error;

      if (!message.line || message.rollup) {
        result.file = origFilePath;
        return result;
      }

      var origPos = sourceMap.originalPositionFor({
        line: message.line,
        column: message.col
      });

      if (origPos.source) {
        result.error.line = origPos.line;
        result.error.col = origPos.column;
        result.file = path.resolve(path.join(file.base, origPos.source));
      }

      return result;
    }).filter(function (result) {
      // if no filter was specified
      // or the error is in the original file
      // or the file matches the filter
      return !importsFilter ||
        result.file === origFilePath ||
        globule.isMatch(importsFilter, [path.relative(process.cwd(), result.file)]);
    });

    // print errors
    mappedResults.forEach(function (result) {
      var message = result.error;
      allErrors.push(message);

      var location = '';
      if (typeof message.line != 'undefined') {
        location =
          colors.magenta(message.line) +
          ',' +
          colors.magenta(message.col);
      }

      gutil.log(
        colors.cyan('lesslint') +
        ' ' +
        colors.magenta(result.file) +
        ':' +
        location +
        ' (' +
        message.rule.id +
        ') ');

      gutil.log(
        message.type.toUpperCase() +
        ': ' +
        message.message +
        ' ' +
        message.rule.desc +
        ' Browsers: ' +
        message.rule.browsers);
    });

    callback(null, file);
  };

  var throwErrors = function throwErrors() {
    if (allErrors.length) {
      this.emit('error', new gutil.PluginError(pluginName, 'Linting failed'));
    }

    this.emit('end');
  };

  return through.obj(reportErrors, throwErrors);
};
