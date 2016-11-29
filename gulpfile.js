const gulp = require('gulp');
const mysqlDump = require('mysqldump');
const datetime = require('node-datetime');
const dt = datetime.create();
const mkdirp = require('mkdirp');
const gulpSequence = require('gulp-sequence');
const replace = require('gulp-batch-replace');
const del = require('del');
const fs = require('fs');
const zip = require('gulp-zip');
const gzip = require('gulp-gzip');
const tar = require('gulp-tar');
const _ = require('underscore');
const inquirer = require('inquirer');
const glob = require("glob");

const argv = require('yargs')
    .array('replace')
    .default('replace', [])
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
            name: 'exclude',
            message: 'Items to exclude (seperate by spaces)',
            default: false
        },
        {
            type: 'input',
            name: 'replace',
            message: 'Strings to replace in database (old,new old,new)',
            default: false
        }
    ];

    return inquirer.prompt(question).then(answers => {
        options = answers;
        options.interactive = true;
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
    const srcFiles = [options.wppath + '**', options.wppath + '/**/.*'];
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

    if (options.interactive && options.replace != false) {
        options.replace = options.replace.split(' ');
    }

    if (options.replace.length > 0 && options.replace != false) {
        options.replace = options.replace.map((item) => {
            const array = item.split(',');
            return [array[0], array[1]];
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
    })
    .then((err) => {
        return gulp.src([dumpPath])
            .pipe(replace(options.replace))
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
