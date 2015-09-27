/*jslint unparam: true*/
/*jslint node: true*/

'use strict';

var safeEscape = function(input) {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

/** **/
module.exports = {
  bashCmdEscape: safeEscape
};
