# gulp-csslint-less-reporter

A console reporter for csslint that maps errors back to the original less files using less source maps.

## Installation

Install `gulp-csslint-less-reporter` as a development dependency.

```bash
npm install --save-dev gulp-csslint-less-reporter
```

`gulp-csslint`, `gulp-sourcemaps`, and `gulp-less` should also be installed.

## Usage

Less source maps are required in order to map errors back onto the original `less` files. If less source maps are not available, an error will be thrown.

```javascript
var gulp = require('gulp');
var less = require('gulp-less');
var csslint = require('gulp-csslint');
var sourcemaps = require('gulp-sourcemaps');
var lessReporter = require('gulp-csslint-less-reporter');

gulp.task('less', function () {
  return gulp.src('src/**/*.less')
    .pipe(sourcemaps.init()) // sourcemaps are required
    .pipe(less())
    .pipe(csslint())
    .pipe(lessReporter())
    .pipe(gulp.dest('build'));
});
```

## API

### lessReporter()

Errors will be reported in all files and `@imports`.

### lessReporter(pattern)

#### pattern

Type: `String` or `Array`

A valid `pattern` for [`globule.isMatch()`](https://www.npmjs.com/package/globule#globule-ismatch).

If an error is in an imported file, you can specify a whitelist `pattern` to filter out unwanted errors in the imported files. Only imported files that **match** the pattern will emit errors. This only applies to imports, any file that is in the pipeline directly will always have linting errors reported.

For example, if you `@import` an external less file from `bower_components` and don't care about linting errors in it, you can whitelist the results to only your sources.

**src/example.less**

```less
@import "bower_components/my-module/src/hello.less";
@import "bower_components/my-module/src/world.less";
```

**gulpfile.js**

```javascript
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var csslint = require('gulp-csslint');
var lessReporter = require('gulp-csslint-less-reporter');

gulp.task('less', function () {
  return gulp.src('src/**/*.less')
    .pipe(sourcemaps.init()) // sourcemaps are required
    .pipe(less())
    .pipe(csslint())
    .pipe(lessReporter('src/**/*.less')) // errors in bower_components will be ignored
    .pipe(gulp.dest('build'));
});
```
## Error Handling

Errors will be written to the console as they are encountered. An exception will be thrown after reporting all errors.

To capture that exception so that the pipline will continue, add a listener to the `error` event and then you can handle the error as you like.

```javascript
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var csslint = require('gulp-csslint');
var lessReporter = require('gulp-csslint-less-reporter');

var shouldThrow = true;

gulp.task('less', function () {
  return gulp.src('src/**/*.less')
    .pipe(sourcemaps.init()) // sourcemaps are required
    .pipe(less())
    .pipe(csslint())
    .pipe(lessReporter())
    .on('error', function (err) {
      // decide whether to throw the error
      if (shouldThrow) {
        throw err;
      }
    })
    .pipe(gulp.dest('build'));
});
```
