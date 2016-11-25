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
var globule = require('globule');

var argv = require('yargs')
    .default('oldDomain', '')
    .default('newDomain', '')
    .default('archiver', 'tar')
    .array('excludeDir')
    .argv
    
var dir = dt.format('m-d-y_H.M.S');

RegExp.escape = function(s) {
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
    var srcFiles = [
        '../**',
        '!../exports', '!../exports/**'
    ];

    if (!!argv.excludeDir) {
        _.each(argv.excludeDir, (dir) => {

            var files = globule.find('**/' + dir);

            srcFiles.push(
                '!' + dir, '!' + dir + '/**'
            );
        });
    }

    if (argv.archiver == 'zip') {
        return gulp.src(srcFiles, {base: './'})
            .pipe(zip('files.zip'))
            .pipe(gulp.dest('./' + dir));
    }

    if (argv.archiver == 'tar') {
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
            host: argv.dbhost,
            user: argv.dbuser,
            password: argv.dbpass,
            database: argv.dbdatabase,
            dest: dumpPath 
        }, (err) => {
            if(err !== null) return reject(err);
            resolve(dumpPath);
        });
    })
    .then((err,res) => {
        if(err !== null);
        return gulp.src([dumpPath])
            .pipe(replace(RegExp.escape(argv.oldDomain), argv.newDomain))
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
    'setup',
    'archiveFiles',
    'dumpDatabase',
    'clearUp'
));