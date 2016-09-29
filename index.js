/*
 * Copyright 2015 Palantir Technologies, Inc.
 *
 * Licensed under MIT (https://github.com/palantir/gulp-csslint-less-reporter/blob/master/LICENSE)
 */

"use strict";

var path = require("path");

var globule = require("globule");
var gutil = require("gulp-util");
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var through = require("through2");

var colors = gutil.colors;

var pluginName = "gulp-csslint-less-reporter";

module.exports = function lessReporter(importsFilter) {
    var allErrors = [];

    var reportErrors = function reportErrors(file, enc, callback) {
        if (!file.csslint || file.csslint.success) {
            return callback(null, file);
        }

        var origFilePath = path.resolve(gutil.replaceExtension(file.path, ".less"));

        if (!file.sourceMap) {
            return callback(new gutil.PluginError(
                pluginName,
                "Source map not found for file: " + origFilePath));
        }

        var sourceMap = new SourceMapConsumer(file.sourceMap);

        // resolve original lines and filter to relevant files
        var mappedResults = file.csslint.report.messages.map(function (result) {
            if (!result.line || result.rollup) {
                result.file = origFilePath;
                return result;
            }

            var origPos = sourceMap.originalPositionFor({
                line: result.line,
                column: result.col,
            });

            if (origPos.source) {
                result.line = origPos.line;
                result.col = origPos.column;
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
            allErrors.push(result);

            var location = "";
            if (typeof result.line != "undefined") {
                location =
                    colors.magenta(result.line) +
                    "," +
                    colors.magenta(result.col);
            }

            gutil.log(
                colors.cyan("lesslint") +
                " " +
                colors.magenta(result.file) +
                ":" +
                location +
                " (" +
                result.rule.id +
                ") ");

            gutil.log(
                result.type.toUpperCase() +
                ": " +
                result.message +
                " " +
                result.rule.desc +
                " Browsers: " +
                result.rule.browsers);
        });

        callback(null, file);
    };

    /* eslint-disable no-invalid-this */
    var throwErrors = function throwErrors() {
        if (allErrors.length) {
            this.emit("error", new gutil.PluginError(pluginName, "Linting failed"));
        }

        this.emit("end");
    };
    /* eslint-enable no-invalid-this */

    return through.obj(reportErrors, throwErrors);
};
