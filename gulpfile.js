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

const dir = dt.format('m-d-y_H.M.S');
let packageJson = JSON.parse(fs.readFileSync('./package.json'));
const options = !!argv.options ? packageJson[argv.options] : packageJson.gwb.default;

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
    let srcFiles = [options.wppath + '/**', options.wppath + '/**/.*'];

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
    
    return new Promise((resolve, reject) => {
        mysqlDump({
            host: options.dbhost,
            user: options.dbuser,
            password: options.dbpass,
            database: options.dbdatabase,
            dest: dumpPath,
            dropTable: true
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
    let replaceRegExp = [];
    const dumpPath = './' + dir + '/tmp/database.sql';

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
                /s:(.*?):\\"(.*?)\\";/g,
                (match, p1, p2, p3) => {
                    const length = byteLength(
                        p2.replace(/\\"/g, '"')
                        .replace(/\\'/g, '\'')
                        .replace(/\\n/g, 'n')
                        .replace(/\\r/g, 'r')
                        .replace(/\\t/g, 't')
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
        .pipe(gulp.dest('./' + dir));
});

gulp.task('finalise', () => {
    // Fix empty-date error
    prependFile('./' + dir + '/database.sql', "SET sql_mode = '';\n\n");

    // Report to console
    console.log('Database: '.yellow, `${dir}/database.sql`.green);
    console.log('Files: '.yellow, `${dir}/files.${options.archiver}`.green);

    // Write upload command to package.json
    if (!!options.sshUser && !!options.sshHost && !!options.sshPath) {
        packageJson.scripts.upload = `scp ${dir}/files.${options.archiver} ${options.sshUser}@${options.sshHost}:${options.sshPath}`;
        packageJson.scripts.upload += ` && ssh -t ${options.sshHost} 'cd ${options.sshPath} ; bash'`;
        fs.writeFile(
            './package.json', 
            JSON.stringify(packageJson, null, 2), (err) => {
                if(err) {
                    return console.log(err);
                }
            }
        );
    }
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

gulp.task('database', gulpSequence(
    'setup',
    'dumpDatabase',
    'replaceStrings',
    'clearUp',
    'finalise'
));

gulp.task('files', gulpSequence(
    'setup',
    'archiveFiles',
    'clearUp',
    'finalise'
));
