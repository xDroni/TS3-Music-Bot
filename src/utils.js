const prompt = require('prompt-sync')();
const path = require('path');

/** @param {string} str */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSrcPath() {
    return path.dirname(process.mainModule.filename);
}

module.exports = {
    getSrcPath,
    escapeRegExp,

    /** @param {string} name */
    getArgument(name) {
        for (let arg of process.argv) {
            let regexp = new RegExp(`^${escapeRegExp(name)}`);
            if( arg.match(regexp) )
			    return arg.replace(regexp, '').substring(1);
        }

        try {//ask user to type password in console
            return prompt(name + ': ') || '';
        } catch (e) {
            console.error("Argument " + name + " not found. Closing program.");
            process.exit();
            return '';
        }
    }
};