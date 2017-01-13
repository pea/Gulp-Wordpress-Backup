# Gulp Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to directory outside of Wordpress installation
2. Execute `npm install`

## Setup
Configure gwb in package.json

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
        "wp-content/themes/**/node_modules",
        "wp-content/themes/**/vendor"
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
If SSH details are provided the script will generate a command in package.json to upload the archived files and SSH you into the server. To execute this command run:
```ssh
node run upload
```

To extract the archive and replace existing files run:
```ssh
tar -xvzf files.tar.gz -C .
```

Alternatively, create the file `build.sh` in the root with the contents:
```
tar -xvzf files.tar.gz -C . && rm ./files.tar.gz && rm ./files.zip
```
Then Give it execution permissions using `chmod +x build.sh`. To run, execute `./build.sh`.