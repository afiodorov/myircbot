var config = require('./config.js');
var irc = require('irc');
var spawn = require('child_process').spawn;
var stdin = process.openStdin();
var fs = require('fs');

var bot = new irc.Client(config.server, config.botName, {
      userName: config.botName,
      realName: config.botName,
      password: config.password,
      port: 6697,
      localAddress: null,
      debug: false,
      showErrors: false,
      autoRejoin: true,
      autoConnect: true,
      channels: config.channels,
      secure: true,
      selfSigned: true,
      certExpired: true,
      floodProtection: false,
      floodProtectionDelay: 1000,
      sasl: true,
      stripColors: false,
      channelPrefixes: '&#',
      messageSplit: 512,
      encoding: 'UTF-8'
    }
);

bot.addListener('registered', function(message) {

});

var getDate = function() {
  var d = new Date();
  var p = function(a) {
    var arr = ['0', '0'].concat(a.toString().split(''));
    return arr[arr.length - 2] + arr[arr.length - 1];
  };

  return [d.getUTCFullYear(), p(d.getUTCMonth() + 1),
    p(d.getUTCDate())].join('-') + ' ' + [p(d.getUTCHours()),
      p(d.getUTCMinutes()), p(d.getUTCSeconds())].join(':') + ' UTC';
};

bot.addListener('message',
  function(nick, to, messageTxt) {
    var re = /:grep .*/;
    if (messageTxt.match(re)) {
      var args = messageTxt.split(' ');
      args.shift();
      var grepArgs = ['-h', '-i', '-m 5'];
      grepArgs.push(args.join(' '));
      grepArgs = grepArgs.concat(config.logfiles);
      grepArgs.push(config.gitterLog);
      var grep = spawn('grep', grepArgs);
      console.log('running grep ' + grepArgs.join(' '));
      grep.stdout.on('data', function(data) {
        console.log('sending output of grep to '  + nick);
        bot.say(nick, data.toString());
      });
    }
});

bot.addListener('message' + config.channels[0],
  function(from, message) {
    var logfile = '[' + getDate() + ']' + ' ' +
      from + ': ' + message + "\n";
    fs.appendFile(config.gitterLog, logfile, function (err) {
      if(err) {
        console.log('error: ' + err);
      }
     });
});

var onDisconnected = function() {
  process.exit();
};

bot.addListener('error', function(message) {
  console.log('error: ', message);
});

process.on('SIGINT', function() {
  bot.disconnect(onDisconnected);
});

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then substring()
    bot.say(config.owner, d.toString().trim())
});
