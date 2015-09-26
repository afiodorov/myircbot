var config = require('./config.js');
var irc = require('irc');
var spawn = require('child_process').spawn;
var stdin = process.openStdin();
var fs = require('fs');
var exec = require('child_process').exec;
var date = require('./date.js');

var safeEscape = function(input) {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

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
        console.log('sending output of grep to ' + nick);
        bot.say(nick, data.toString());
      });
    } else if (messageTxt.match(/^:links today$/)) {
      todaysLinksCmd = 'cat ' + config.gitterLog;
      todaysLinksCmd += ' | egrep "^\\\[' + date.getDateWihoutTime() + '" ';
      todaysLinksCmd += ' | egrep -o "(mailto|ftp|http(s)?://){1}[^\'\\\")]+"';
      exec(todaysLinksCmd, function(error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        bot.say(nick, stdout.toString());
      });
    } else if (messageTxt.match(/^:quote @?.*\s.*/)) {
      var dateRe = '^\\\[[0-9]{4}-[0-9]{2}-[0-9]{2} ' +
        '[0-9]{2}:[0-9]{2}:[0-9]{2} UTC\\\]';

      var quoteCmd = 'cat ' + config.gitterLog;
      var searchArgs = messageTxt.split(' ');
      searchArgs.shift();

      var potentialName = searchArgs[0];
      var nameGiven = potentialName.substring(0, 1) === '@';
      if (nameGiven) {
        var name = potentialName.substring(1);
        searchArgs.shift();
        quoteCmd += ' | egrep "' + dateRe + ' ' + safeEscape(name) + '"';
      }

      var searchStr = searchArgs.join(' ');
      quoteCmd += ' | grep -i "' + safeEscape(searchStr) + '"';
      quoteCmd += ' | tail -n 1';
      console.log('running ' + quoteCmd);
      exec(quoteCmd, function(error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        if (to === config.botName) {
          bot.say(nick, stdout.toString());
          return;
        }
        bot.say(to, stdout.toString());
      });
    }
});

bot.addListener('message' + config.channels[0],
  function(from, message) {
    var logfile = '[' + date.getDateWithTime() + ']' + ' ' +
      from + ': ' + message + '\n';
    fs.appendFile(config.gitterLog, logfile, function(err) {
      if (err) {
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

stdin.addListener('data', function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then substring()
    bot.say(config.owner, d.toString().trim());
});
