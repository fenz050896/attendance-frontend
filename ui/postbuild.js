import { join, basename, resolve } from 'path';
import { existsSync, readdirSync, lstatSync, unlinkSync, rmdirSync, writeFileSync, readFileSync, mkdirSync } from 'fs';

const targetSource = './dist'; // Relative path to copy files from
const targetDestination = '../service/build'; // Relative path to copy files to

/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874
 */
function rimraf(dir_path) {
    try {
        if (existsSync(dir_path)) {
            readdirSync(dir_path).forEach(function(entry) {
                const entry_path = join(dir_path, entry);
                if (lstatSync(entry_path).isDirectory()) {
                    rimraf(entry_path);
                } else {
                    unlinkSync(entry_path);
                }
            });
            rmdirSync(dir_path);
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * Copy a file
 * @param {string} source
 * @param {string} target
 * @see https://stackoverflow.com/a/26038979
 */
function copyFileSync(source, target) {
    try {
        let targetFile = target;
        // If target is a directory a new file with the same name will be created
        if (existsSync(target)) {
            if (lstatSync(target).isDirectory()) {
                targetFile = join(target, basename(source));
            }
        }
        writeFileSync(targetFile, readFileSync(source));
    } catch (err) {
        console.log(err);
    }
}

/**
 * Copy a folder recursively
 * @param {string} source
 * @param {string} target
 * @see https://stackoverflow.com/a/26038979
 */
function copyFolderRecursiveSync(source, target, root = false) {
    try {
        let files = [];
        // Check if folder needs to be created or integrated
        const targetFolder = root ? target : join(target, basename(source));
        if (!existsSync(targetFolder)) {
            mkdirSync(targetFolder);
        }
        // Copy
        if (lstatSync(source).isDirectory()) {
            files = readdirSync(source);
            files.forEach(function (file) {
                const curSource = join(source, file);
                if (lstatSync(curSource).isDirectory()) {
                    copyFolderRecursiveSync(curSource, targetFolder);
                } else {
                    copyFileSync(curSource, targetFolder);
                }
            });
        }
    } catch (err) {
        console.log(err);
    }
}

// Calculate absolute paths using the relative paths we defined at the top
const sourceFolder = resolve(targetSource);
const destinationFolder = resolve(targetDestination);

// Remove destination folder if it exists to clear it
if (existsSync(destinationFolder)) {
    rimraf(destinationFolder)
}

// Copy the build over
copyFolderRecursiveSync(sourceFolder, destinationFolder, true)
