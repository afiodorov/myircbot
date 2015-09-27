'use strict';
/*jslint unparam: true*/
/*jslint node: true*/

var escape = require('./escape.js');
var exec = require('child_process').exec;
var config = require('./config.js');
var spawn = require('child_process').spawn;
var date = require('./date.js');

var bot = null;

var setBot = function(bot_) {
  bot = bot_;
};

var links = function(nick, to, rawCommand) {
  var todaysLinksCmd = 'cat ' + config.gitterLog;
  todaysLinksCmd += ' | egrep "^\\[' + date.getDateWihoutTime() + '" ';
  todaysLinksCmd += ' | egrep -o "(mailto|ftp|http(s)?://){1}[^\'\\\")]+"';
  exec(todaysLinksCmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    bot.say(nick, stdout.toString());
  });
};

var grep = function(nick, to, rawCommand) {
  var args = rawCommand.split(' ');
  args.shift();
  var grepArgs = ['-h', '-m 5'];
  var searchStr = args.join(' ');
  if (searchStr === searchStr.toLowerCase()) {
    grepArgs.push('-i');
  }
  grepArgs.push(searchStr);
  grepArgs = grepArgs.concat(config.logfiles);
  grepArgs.push(config.gitterLog);
  var grep = spawn('grep', grepArgs);
  console.log('running grep ' + grepArgs.join(' '));
  grep.stdout.on('data', function(data) {
    console.log('sending output of grep to ' + nick);
    bot.say(nick, data.toString());
  });
};

var quote = function(nick, to, rawCommand) {
      var dateRe = '^\\[[0-9]{4}-[0-9]{2}-[0-9]{2} ' +
        '[0-9]{2}:[0-9]{2}:[0-9]{2} UTC\\]'; // jslint ignore:line

      var quoteCmd = 'cat ' + config.gitterLog;
      var searchArgs = rawCommand.split(' ');
      searchArgs.shift();

      var potentialName = searchArgs[0];
      var nameGiven = potentialName.substring(0, 1) === '@';
      if (nameGiven) {
        var name = potentialName.substring(1);
        searchArgs.shift();
        quoteCmd += ' | egrep "' + dateRe + ' ' + escape.bashCmdEscape(name) +
                    '"';
      } else {
        quoteCmd += ' | grep -v ":quote "';
      }

      var searchStr = searchArgs.join(' ');
      var caseOption = '';
      if (searchStr === searchStr.toLowerCase()) {
        caseOption = '-i ';
      }
      quoteCmd += ' | grep ' + caseOption + '"' +
        escape.bashCmdEscape(searchStr) + '"';
      quoteCmd += ' | tail -n 1';
      console.log('running ' + quoteCmd);
      exec(quoteCmd, function(error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        var quoteStr = stdout.toString();
        if (!quoteStr) {
          return;
        }
        var msg = '> ' + quoteStr;
        if (to === config.botName) {
          bot.say(nick, msg);
          return;
        }
        bot.say(to, msg);
      });
};

/** **/
module.exports = {
  setBot: setBot,
  quote: quote,
  links: links,
  grep: grep
};
