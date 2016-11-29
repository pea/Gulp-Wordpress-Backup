# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to directory outside of Wordpress installation
2. Execute `npm install`

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
    --replace (optional) <curent string>,<new string>
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

### Replace String in Database (--replace)
Replace a string (usually a domain) in the database dump. 
```ssh
--replace localhost,mydomain.com --replace olddomain.com,newdomain.com
```
When using the interactive prompt the synax is slightly different
```ssh
localhost,mydomain.com olddomain.com,newdomain.com
```

### Type of Compression (--archiver)
Choose the archiver to use whem compressing the files. You have the option of zip and tar.gz. Zip can have problems with symlinks. If unzipping is failing use tar.gz.
```ssh
--archiver zip
```
Default: tar.gz

### Exclude Files and Directories (--exclude)
Exclude a file or directory. Uses glob syntax. No leading slash.

```ssh
--exclude wp-content/themes/**/node_modules --exclude wp-content/themes/**/vendor
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