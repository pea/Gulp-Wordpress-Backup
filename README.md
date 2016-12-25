# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to directory outside of Wordpress installation
2. Execute `npm install`

## Setup
Configure nwb in package.json

## Settings

`nwb.wppath` Path to local Wordpress installation

`nwb.dbhost` Database host

`nwb.dbuser` Database user

`nwb.dbpass` Database password

`nwb.dbdatabase` Database name

`nwb.dbprefix` New table prefix

`nwb.archiver` Archiver to use (zip | tar.gz)

`nwb.replace` Strings to replace in database (array | false)

`nwb.include` Directories to only include in archive, subject to nwb.exclude (array | false)

`nwb.exclude` Directories to exclude from archive (array | false)

`nwb.sshUser` SSH username (string | false)

`nwb.sshHost` SSH host (string | false)

`nwb.sshPath` SSH path to server's Wordpress installation (string | false)

#### Example
```json
"nwb": {
    "wppath": "../Wordpress",
    "dbhost": "localhost",
    "dbuser": "wordpress",
    "dbpass": "wordpress",
    "dbdatabase": "wordpress",
    "dbprefix": "wp_",
    "archiver": "tar.gz",
    "replace": [
      [
        "localhost", "peabay.xyz"
      ]
    ],
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