// validation.js
// Provide validation tools common to many services

function Validation() {
};
module.exports = Validation;

//For a basic security check, disallow the following characters: / \ .
// That way, somebody can't specify a parameter ../spameggs, which then gets concatenated
// with other parts of a filesystem path.
// However, this is not a full check of valid filenames on all possible platforms
// e.g. Windows doesn't allow a colon or a double ". Filenames containing these characters will
// throw an error whenever the filesystem is actually accessed.
Validation.prototype.containsPath = function (value) {
    if (value.search('[\\\\/.]') != -1) {
        return true;
    } else {
        return false;
    }
}
