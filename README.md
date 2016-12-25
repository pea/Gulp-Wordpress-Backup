# Node Wordpress Backup
Gulpfile to backup a Wordpress installation for migration.

## Installation
1. Clone to directory outside of Wordpress installation
2. Execute `npm install`

## Usage
Configure nwb in package.json and run:
```ssh
gulp
```

## Settings
```json
"nwb": {
    "wppath": "../Wordpress", `Path to Wordpress installation to backup`
    "dbhost": "localhost", // Database host
    "dbuser": "wordpress", // Database user
    "dbpass": "wordpress", // Database password
    "dbdatabase": "wordpress", // Database name
    "dbprefix": "wp_", // Database prefix
    "archiver": "tar.gz", // Archiver to use (zip | tar.gz)
    "replace": [ // Array of strings to replace in database dump
      [
        "localhost",
        "sinclair.peabay.xyz"
      ]
    ],
    "exclude": [ // Directoties to exclude from archive
        "wp-content/themes/**/node_modules",
        "wp-content/themes/**/vendor"
    ],
    "include": [ // Directories to include only
      "/wp-content"
    ],
    "sshUser": "peter", // SSH username
    "sshHost": "peterbailey.eu", // SSH host
    "sshPath": "sinclair.peterbailey.eu" // SSH path
}
}
```

## Multisite
Backing up an entire mutlisite is exactly the same as a single site. The only difference is in the replacement of each sub-site domain opposed to one.

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