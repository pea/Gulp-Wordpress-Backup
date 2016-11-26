# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to /exports
2. Execute `npm install` in /exports

## Usage
### Interactive
```ssh
gulp --interactive
```

### Non-interactive
```ssh
gulp
    --wppath <path to wordpress>
    --dbhost <hostname>
    --dbuser <database username>
    --dbpass <database password>
    --dbdatabase <database name>
    --dbprefix (optional) (default: wp_) <table prefix>
    --olddomain (optional) <old domain> --newdomain <new domain>
    --archiver <zip | tar.gz> (default: tar.gz)
    --exclude (optional) <file/ directory path>
```

## Commands

### Path to Wordpress (--wppath)
Specify the path to the wordpress installation. Requires a trailing slash.
```ssh
--wppath ../Wordpress/
```

### Change Table Prefix (--dbprefix)
```ssh
--dbprefix mysite_
```

### Replace Domain in Database (--olddomain & --newdomain)
```ssh
--olddomain localhost --newdomain mywebsite.com
```

### Type of Compression (--archiver)
Choose the archiver to use whem compressing the files. You have the option of zip and tar.gz. Zip can have problems with symlinks. If unzipping is failing use tar.gz.
```ssh
--archiver zip
```
Default: tar.gz

### Exclude Files and Directories (--exclude)
Exclude a file or directory. Uses glob syntax. No leading slash.

Exclude /node_modules and /vendor directories from all themes
```ssh
--exclude ../Wordpress/wp-content/themes/**/node_modules --exclude ../Wordpress/wp-content/themes/**/vendor
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