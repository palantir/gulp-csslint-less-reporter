/*
 * Copyright 2015 Palantir Technologies, Inc.
 *
 * Licensed under MIT (https://github.com/palantir/gulp-csslint-less-reporter/blob/master/LICENSE)
 */

"use strict";

var assert = require("assert");
var gulp = require("gulp");
var eslint = require("gulp-eslint");
var gulpif = require("gulp-if");

var less = require("gulp-less");
var csslint = require("gulp-csslint");
var sourcemaps = require("gulp-sourcemaps");
var lessReporter = require("./");

var isWatch = false;

gulp.task("eslint", function () {
    return gulp.src("*.js")
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(gulpif(isWatch, eslint.failAfterError()));
});

// Verify when linting, when errors are found an error is emitted
gulp.task("lessHasErrorsTest", function (cb) {
    var error;
    gulp.src("test/example.less")
        // sourcemaps are required
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(csslint())
        .pipe(lessReporter())
        .on("error", function (err) {
            error = err;
        })
        .on("end", function () {
            assert(error, "Linting errors should have been found in elements.");
            cb(!error);
        });
});

// Verify when linting, when errors are not found an error is not emitted
gulp.task("lessHasNoErrorsTest", function (cb) {
    var error;
    gulp.src("test/passing.less")
        // sourcemaps are required
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(csslint())
        .pipe(lessReporter())
        .on("error", function (err) {
            error = err;
        })
        .on("end", function () {
            assert(!error, "Linting errors should not have been found in passing.");
            cb(!!error);
        });
});

// Verify when linting, when errors are found and in whitelisted imported files, an error is emitted
gulp.task("lessHasErrorsNotFilteredOutByWhitelistTest", function (cb) {
    var error;
    gulp.src("test/example.less")
        // sourcemaps are required
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(csslint())
        .pipe(lessReporter("test/elements.less"))
        .on("error", function (err) {
            error = err;
        })
        .on("end", function () {
            assert(error, "Linting errors should have been found in elements.");
            cb(!error);
        });
});

// Verify when linting, when errors are found but not in whitelisted imported files, an error is not emitted
gulp.task("lessHasErrorsFilteredOutByWhitelistTest", function (cb) {
    var error;
    gulp.src("test/example.less")
        // sourcemaps are required
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(csslint())
        .pipe(lessReporter("test/passing.less"))
        .on("error", function (err) {
            error = err;
        })
        .on("end", function () {
            assert(!error, "Linting errors should not have been found in example or passing.");
            cb(!!error);
        });
});

gulp.task("watch", function () {
    isWatch = true;
    gulp.watch(["*.js", "test/*.less"], ["default"]);
});

gulp.task("default", [
    "eslint",
    "lessHasErrorsTest",
    "lessHasNoErrorsTest",
    "lessHasErrorsNotFilteredOutByWhitelistTest",
    "lessHasErrorsFilteredOutByWhitelistTest",
]);
