const _ = require('underscore');
const argv = require('yargs').argv;
const byteLength = require('utf8-byte-length');
const colors = require("colors");
const datetime = require('node-datetime');
const del = require('del');
const dt = datetime.create();
const exec = require("exec");
const fs = require('fs');
const glob = require("glob");
const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');
const gzip = require('gulp-gzip');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const mysqlDump = require('mysqldump');
const replace = require('gulp-replace');
const tar = require('gulp-tar');
const zip = require('gulp-zip');
const prependFile = require('prepend-file');

let packageJson = JSON.parse(fs.readFileSync('./package.json'));
const options = packageJson.sqlReplace;

RegExp.escape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Replace strings in sql dump
 */
gulp.task('replaceStrings', () => {
    let replaceRegExp = [];
    const dumpPath = './old/' + options.filename;

    if (options.replace != false) {
        replaceRegExp = new RegExp(Object.keys(options.replace).join('|'),'gi');
    }

    return gulp.src([dumpPath])
        .pipe(
            replace(
                replaceRegExp,
                (match) => options.replace[match]
            )
        )
        .pipe(
            replace(
                /s:([0-9]+):\\"(.*?)\\";/g,
                (match, p1, p2, p3) => {
                    const length = byteLength(
                        p2.replace(/\\"/g, '"')
                        .replace(/\\'/g, '\'')
                        .replace(/\\n/g, 'n')
                        .replace(/\\r/g, 'r')
                        .replace(/\\t/g, 't')
                        .replace(/\\0/g, '0')
                        .replace(/\\x1a/g, '1')
                        .replace(/\\Z/g, 'Z')
                    );
                    if(typeof p2 != 'undefined') {
                        return `s:${length}:"${p2.replace(/\\"/g, '"')}";`
                    } else {
                        return `s:0:"";`
                    }
                }
            )
        )
        .pipe(
            replace(
                /(CREATE TABLE IF NOT EXISTS `)(.[^_])_(\S+)/gi,
                'CREATE TABLE IF NOT EXISTS `' + options.dbprefix + '$3'
            )
        )
        .pipe(
            replace(
                /(INSERT INTO `)(.[^_])_(\S+)/gi,
                'INSERT INTO `' + options.dbprefix + '$3'
            )
        )
        .pipe(gulp.dest('./new'));
});

gulp.task('finalise', () => {
    // Fix empty-date error
    prependFile('./new/' + options.filename, "SET sql_mode = '';\n\n");
});

gulp.task('default', gulpSequence(
    'replaceStrings',
    'finalise'
));