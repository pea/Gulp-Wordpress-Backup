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
const prompt = require('gulp-prompt');
const inquirer = require('inquirer');
const glob = require("glob");

const argv = require('yargs')
    .default('olddomain', '')
    .default('newdomain', '')
    .default('dbprefix', 'wp_')
    .default('archiver', 'tar.gz')
    .array('exclude')
    .argv;

const dir = dt.format('m-d-y_H.M.S');

let options = {};

RegExp.escape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Optional Prompt
 */
gulp.task('prompt', () => {
    if (!argv.interactive) {
        options = argv;
        return;
    }

    const question = [
        {
            type: 'input',
            name: 'wppath',
            message: 'Path to Wordpress installation',
            default: '../Wordpress/'
        },
        {
            type: 'input',
            name: 'archiver',
            message: 'Compress with zip or tar.gz?',
            default: 'tar.gz'
        },
        {
            type: 'input',
            name: 'dbhost',
            message: 'Database host',
            default: 'localhost'
        },
        {
            type: 'input',
            name: 'dbuser',
            message: 'Database username',
            default: 'wordpress'
        },
        {
            type: 'input',
            name: 'dbpass',
            message: 'Database password',
            default: 'wordpress'
        },
        {
            type: 'input',
            name: 'dbdatabase',
            message: 'Database name',
            default: 'wordpress'
        },
        {
            type: 'input',
            name: 'dbprefix',
            message: 'Table prefix',
            default: 'wp_'
        },
        {
            type: 'input',
            name: 'olddomain',
            message: 'Name of old domain to replace',
            default: ''
        },
        {
            type: 'input',
            name: 'newdomain',
            message: 'Name of new domain to replace with',
            default: ''
        },
        {
            type: 'input',
            name: 'exclude',
            message: 'Items to exclude (seperate by spaces)',
            default: false
        }
    ];

    return inquirer.prompt(question).then(answers => {
        options = answers;
        options.exclude = answers.exclude ? answers.exclude.split(' ') : undefined;
    });
});

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
    const srcFiles = [options.wppath + '**'];
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
        return gulp.src(srcFiles)
            .pipe(tar('files.tar'))
            .pipe(gzip())
            .pipe(gulp.dest('./' + dir));
    }
});

/**
 * Dump the database into /tmp, replace the domains and move to /
 */
gulp.task('dumpDatabase', () => {
    const dumpPath = './' + dir + '/tmp/database.sql';
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
    .then((err) => {
        if (err !== null);
        return gulp.src([dumpPath])
            .pipe(
                replace(
                    RegExp.escape(options.olddomain),
                    options.newdomain
                )
            )
            .pipe(replace(/(CREATE TABLE IF NOT EXISTS `)(.[^_])_(\S+)/gi, 'CREATE TABLE IF NOT EXISTS `' + options.dbprefix + '$3'))
            .pipe(replace(/(INSERT INTO `)(.[^_])_(\S+)/gi, 'INSERT INTO `' + options.dbprefix + '$3'))
            .pipe(gulp.dest('./' + dir));
    });
});

/**
 * Delete /temp
 */
gulp.task('clearUp', () => {
    del(['./' + dir + '/tmp/']);
});

gulp.task('default', gulpSequence(
    'prompt',
    'setup',
    'archiveFiles',
    'dumpDatabase',
    'clearUp'
));
