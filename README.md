# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Copy gulpfile.js and package.json to Wordpress root
2. Execute `npm install`

## Usage
Run:
```ssh
gulp --dbhost <hostname> --dbuser <database username> --dbpass <database password> --dbdatabase <database name>
```

`/exports` will be created in the Wordpress root containing the backup. The backup will contain an SQL dump and an archive of the files.

To import the backup, create a database with the SQL dump, Configure wp-config.php and other configuration files.

## Commands

### Replace domain in database
```ssh
gulp --oldDomain localhost --newDomain mywebsite.com
```

### Archiver Option
Choose the archiver to use whem compressing the files. You have the option of zip and tar.gz. Zip can have problems with symlinks. If unzipping is failing use tar.gz.
```ssh
gulp --archive zip
```
Default: tar.gz

### Exclude Directories
Exclude a directory. Uses glob syntax.

Exclude all node_modules directories
```ssh
gulp --excludeDir **/node_modules
```

Exclude /node_modules and /wp-content/themes/mytheme/vendor
```ssh
gulp --excludeDir node_modules --excludeDir wp-content/themes/mytheme/vendor
```