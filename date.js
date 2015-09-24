var prefixWithZero = function(a) {
  var arr = ['0', '0'].concat(a.toString().split(''));
  return arr[arr.length - 2] + arr[arr.length - 1];
};

var p = prefixWithZero;

var getDateWihoutTime = function() {
  var d = new Date();
  return [d.getUTCFullYear(), p(d.getUTCMonth() + 1),
    p(d.getUTCDate())].join('-');
};

var getDateWithTime = function() {
  var d = new Date();
  return getDateWihoutTime() + ' ' + [p(d.getUTCHours()),
      p(d.getUTCMinutes()), p(d.getUTCSeconds())].join(':') + ' UTC';
};


/** **/
module.exports = {
  getDateWithTime: getDateWithTime,
  getDateWihoutTime: getDateWihoutTime
};
