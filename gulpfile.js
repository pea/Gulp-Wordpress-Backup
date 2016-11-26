var gulp = require('gulp');
var mysqlDump = require('mysqldump');
var datetime = require('node-datetime');
var dt = datetime.create();
var mkdirp = require('mkdirp');
var gulpSequence = require('gulp-sequence');
var replace = require("gulp-replace");
var del = require('del');
var fs = require('fs');
var zip = require('gulp-zip');
var gzip = require('gulp-gzip');
var tar = require('gulp-tar');
var _ = require('underscore');
var prompt = require('gulp-prompt');
var inquirer = require('inquirer');

var argv = require('yargs')
    .default('oldDomain', '')
    .default('newDomain', '')
    .default('dbprefix', 'wp_')
    .default('archiver', 'tar.gz')
    .array('exclude')
    .argv
    
var dir = dt.format('m-d-y_H.M.S');

var options = {};

RegExp.escape = function(s) {
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
            type : 'input',
            name : 'archiver',
            message : 'Compress with zip or tar.gz?',
            default : 'tar.gz'
        },
        {
            type : 'input',
            name : 'dbhost',
            message : 'Database host',
            default : 'localhost'
        },
        {
            type : 'input',
            name : 'dbuser',
            message : 'Database username',
            default : 'root'
        },
        {
            type : 'input',
            name : 'dbpass',
            message : 'Database password',
            default : 'password'
        },
        {
            type : 'input',
            name : 'dbdatabase',
            message : 'Database name',
            default : 'wordpress'
        },
        {
            type : 'input',
            name : 'dbprefix',
            message : 'Table prefix',
            default : 'wp_'
        },
        {
            type : 'input',
            name : 'oldDomain',
            message : 'Name of old domain to replace',
            default : 'localhost'
        },
        {
            type : 'input',
            name : 'newDomain',
            message : 'Name of new domain to replace with',
            default : 'mywebsite.com'
        },
        {
            type : 'input',
            name : 'exclude',
            message : 'Items to exclude (seperate by spaces)',
            default : false
        }
    ];

    return inquirer.prompt(question).then(answers => {
        options = answers;
        if (answers.exclude != false) {
            options.exclude = answers.exclude.split(' ');
        }
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

    var srcFiles = [
        '../**',
        '!../exports', '!../exports/**'
    ];

    if (!!options.exclude) {
        _.each(options.exclude, (item) => {
            srcFiles.push(
                '!../' + item
            );

            if (fs.lstatSync('../' + item).isDirectory()) {
                srcFiles.push(
                    '!../' + item + '/**'
                );
            }
        });
    }

    if (options.archiver == 'zip') {
        return gulp.src(srcFiles)
            .pipe(zip('files.zip'))
            .pipe(gulp.dest('./' + dir));
    }

    if (options.archiver == 'tar.gz') {
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
    var dumpPath = './' + dir + '/tmp/database.sql';
    return new Promise((resolve,reject) => {
        mysqlDump({
            host: options.dbhost,
            user: options.dbuser,
            password: options.dbpass,
            database: options.dbdatabase,
            dest: dumpPath 
        }, (err) => {
            if(err !== null) return reject(err);
            resolve(dumpPath);
        });
    })
    .then((err,res) => {
        if(err !== null);
        return gulp.src([dumpPath])
            .pipe(
                replace(
                    RegExp.escape(options.oldDomain),
                    options.newDomain
                )
            )
            .pipe(replace(/(CREATE TABLE IF NOT EXISTS `)(.[^_])_(\S+)/gi, 'CREATE TABLE IF NOT EXISTS `' + options.dbprefix + '$3'))
            .pipe(replace(/(INSERT INTO `)(.[^_])_(\S+)/gi, 'INSERT INTO `' + options.dbprefix + '$3'))
            .pipe(gulp.dest('./' + dir));
    })
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