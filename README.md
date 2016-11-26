# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to /exports
2. Execute `npm install` in /exports

## Usage
```ssh
gulp
    --dbhost <hostname>
    --dbuser <database username>
    --dbpass <database password>
    --dbdatabase <database name>
    --dbprefix (optional) (default: wp_) <table prefix>
    --oldDomain (optional) <old domain> --newDomain <new domain>
    --archiver <zip | tar.gz> (default: tar.gz)
    --exclude (optional) <file/ directory path>
```

Alternatively you can run the prompt which will walk you through the configuration. Just execute:
```ssh
gulp --interactive
```

`exports/` will populate with the backup - an sql dump and an archive of the files.

To import the backup, create a database with the SQL dump, Configure wp-config.php and other configuration files.

## Commands

### Change Table Prefix
```ssh
--dbprefix mysite_
```

### Replace Domain in Database (--oldDomain & --newDomain)
```ssh
--oldDomain localhost --newDomain mywebsite.com
```

### Archiver Option (--archiver)
Choose the archiver to use whem compressing the files. You have the option of zip and tar.gz. Zip can have problems with symlinks. If unzipping is failing use tar.gz.
```ssh
--archiver zip
```
Default: tar.gz

### Exclude Files and Directories (--exclude)
Exclude a file or directory. Uses glob syntax.

Exclude /node_modules and /wp-content/themes/mytheme/vendor
```ssh
--exclude node_modules --exclude wp-content/themes/mytheme/vendor
```

Exclude wp-config.php
```ssh
--exclude wp-config.php
```

## Restoring Files
Upload tar.gz
```ssh
scp <file to upload> <username>@<hostname>:<destination path>
```
To extract and overwrite existing files.
### Extract tar.gz
```ssh
tar -xvzf path/to/files.tar.gz -C path/to/wordpress/root
```