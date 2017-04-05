# Gulp Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

- Backup profiles providing alternative options (live/ staging for example)
- Database Export
    - String replacement with serialized string length fix
    - Table prefix replacement
- File Archiving
    - Choice of Zip or Tar.gz
    - Whether to only archive certain directories
    - Directory exclusion
    - SSH file upload command generation

## Installation
1. Clone to directory outside of Wordpress installation
2. Execute `npm install`

## Setup
Configure the `gwb` object in package.json

## Settings

`gwb.wppath` Path to local Wordpress installation

`gwb.dbhost` Database host

`gwb.dbuser` Database user

`gwb.dbpass` Database password

`gwb.dbdatabase` Database name

`gwb.dbprefix` New table prefix

`gwb.archiver` Archiver to use (zip | tar.gz)

`gwb.replace` Strings to replace in database (object | false)

`gwb.include` Directories to only include in archive, subject to gwb.exclude (array | false)

`gwb.exclude` Directories to exclude from archive (array | false)

`gwb.sshUser` SSH username (string | false)

`gwb.sshHost` SSH host (string | false)

`gwb.sshPath` SSH path to server's Wordpress installation (string | false)

#### Example
```json
"gwb": {
    "wppath": "../Wordpress",
    "dbhost": "localhost",
    "dbuser": "wordpress",
    "dbpass": "wordpress",
    "dbdatabase": "wordpress",
    "dbprefix": "wp_",
    "archiver": "tar.gz",
    "replace": {
        "localhost": "peabay.xyz"
    },
    "include": [
      "/wp-content"
    ],
    "exclude": [
        "wp-content/themes/**/node_modules"
    ],
    "sshUser": "peabay",
    "sshHost": "peabay.xyz",
    "sshPath": "peabay.xyz/Wordpress"
}
```

## Usage
#### Backup Database and Files
```ssh
gulp
```
#### Backup Only Files
```ssh
gulp files
```
#### Backup Only Database
```ssh
gulp database
```

## Specifying An Alternative Set of Options
Use the `--options` flag to specify the object key of alternative options. Without this flag 'gwb' will be used. Useful for storing settings for staging and live environments.

## Multisites
Backing up a single site from a multisite is not possible, however backing up an entire multisite is. Remember to replace the domain of each site in the database.

## Restoring Files
If SSH details are provided the script will generate a command in package.json to upload the backup and SSH you into the server. To execute this command run:
```ssh
node run upload
```

## Extracting and Importing
- Exract the files archive with `tar -xvzf files.tar.gz -C .`
- Import the database with `mysql -u username -p -h localhost <database name> < database.sql`

Alternatively you can create a bash script to do this for you.

- Have the files uploaded outside of the Wordpress installation.
- Creat a file called import.sh in the same location.
- Give import.sh execution permissions with `chmod +x build.sh`.
- In import.sh insert the following (edit public_html directory name if different) and execute `./import.sh` to run script.

```ssh
#!/bin/bash

# Extract and delete files.tar.gz
if [ -f ./files.tar.gz ]; then
    tar -xvzf files.tar.gz -C ./public_html && rm ./files.tar.gz
fi

# Extract and delete files.zip
if [ -f ./files.zip ]; then
    tar -xvzf files.zip -C ./public_html && rm ./files.zip
fi

# Import and delete database.sql 
if [ -f ./database.sql ]; then
    mysql -u <database username> -p'<database password>' -h localhost <database name> < database.sql
fi
```

To download the database or files from the server after generating a backup there execute:

`scp username@host.com:Exports/02-15-17_17.57.39/files.tar.gz ~/Desktop`
