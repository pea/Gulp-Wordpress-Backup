const gulp = require('gulp');
const mysqlDump = require('mysqldump');
const datetime = require('node-datetime');
const dt = datetime.create();
const mkdirp = require('mkdirp');
const gulpSequence = require('gulp-sequence');
const replace = require('gulp-replace');
const del = require('del');
const fs = require('fs');
const zip = require('gulp-zip');
const gzip = require('gulp-gzip');
const tar = require('gulp-tar');
const _ = require('underscore');
const inquirer = require('inquirer');
const glob = require("glob");
const colors = require("colors");
const exec = require("exec");

const dir = dt.format('m-d-y_H.M.S');
let packageJson = JSON.parse(fs.readFileSync('./package.json'));
const options = packageJson.nwb;

RegExp.escape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Setup directory structure
 */ 
gulp.task('setup', () => {
    return mkdirp('./' + dir + '/tmp', (err) => {
        if (err) throw err;
    });
});

/**
 * Archive files, excluding vendors
 */
gulp.task('archiveFiles', () => {
    let srcFiles = [options.wppath + '/**', options.wppath + '/**/*.*'];

    if (!!options.include) {
        srcFiles = [];
        _.each(options.include, (item) => {
            srcFiles.push(
                options.wppath + item + '/**/*.*'
            );
        });
    }

    if (!!options.exclude) {
        _.each(options.exclude, (item) => {
            srcFiles.push(
                '!' + options.wppath + item,
                '!' + options.wppath + item + '/**'
            );
        });
    }

    if (options.archiver === 'zip') {
        return gulp.src(srcFiles)
            .pipe(zip('files.zip'))
            .pipe(gulp.dest('./' + dir));
    }

    if (options.archiver === 'tar.gz') {
        return gulp.src(srcFiles, {base: options.wppath})
            .pipe(tar('files.tar'))
            .pipe(gzip())
            .pipe(gulp.dest('./' + dir));
    }
});

/**
 * Dump the database into /tmp
 */
gulp.task('dumpDatabase', () => {
    const dumpPath = './' + dir + '/tmp/database.sql';
    if (options.replace.length > 0 && options.replace != false) {
        options.replace = options.replace.map((item) => {
            return [item[0], item[1]];
        });
    }
    
    return new Promise((resolve, reject) => {
        mysqlDump({
            host: options.dbhost,
            user: options.dbuser,
            password: options.dbpass,
            database: options.dbdatabase,
            dest: dumpPath
        }, (err) => {
            if (err !== null) return reject(err);
            resolve(dumpPath);
        });
    })
    .catch((err) => {
        console.log(err);
    });
});

/**
 * Replace strings in sql dump
 */
gulp.task('replaceStrings', () => {
    const dumpPath = './' + dir + '/tmp/database.sql';
    return gulp.src([dumpPath])
        .pipe(replace(options.replace))
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
        .pipe(
            replace(
                /s:(\d+):([\\\\]?"[\\\\]?"|[\\\\]?"((.*?)[^\\\\])[\\\\]?")/g,
                (match, p1, p2, p3) => typeof p3 != 'undefined' ? `s:${p3.length}:"${p3}"` : ''
            )
        )
        .pipe(gulp.dest('./' + dir));
});

gulp.task('finalise', () => {
    // Report to console
    console.log('Database: '.yellow, `${dir}/database.sql`.green);
    console.log('Files: '.yellow, `${dir}/files.${options.archiver}`.green);

    // Write upload command to package.json
    packageJson.scripts.upload = `scp ${dir}/files.${options.archiver} ${options.sshUser}@${options.sshHost}:${options.sshPath}`;
    fs.writeFile(
        './package.json', 
        JSON.stringify(packageJson, null, 2), (err) => {
            if(err) {
                return console.log(err);
            }
        }
    );

});

/**
 * Delete /temp
 */
gulp.task('clearUp', () => {
    del(['./' + dir + '/tmp/']);
});

gulp.task('default', gulpSequence(
    'setup',
    'archiveFiles',
    'dumpDatabase',
    'replaceStrings',
    'clearUp',
    'finalise'
));