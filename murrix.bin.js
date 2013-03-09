#!/usr/bin/env node

var program = require("commander");
var Murrix = require("./murrix.js").Murrix;

program.version("0.0.1");
program.option("-c, --config <filename>", "Configuration file", "./config.json");


program
  .command("server")
  .description("Start the MURRiX Server")
/*  .option("-d, --daemon", "Start in daemon mode")*/
  .action(function(options)
  {
    var murrix = new Murrix(program);

    murrix.on("done", function()
    {
      murrix.server.start();
    });

    murrix.emit("init");
  });

program
  .command("import <directory>")
  .description("Import a directory")
/*  .option("-i, --id <parent id>", "Id of node to import files into, default is to create a new album for every folder")*/
  .option("-t, --type [type]", "Type of node to create as parent, default is album", "album")
  .option("-u, --user [username]", "Username which is used to import, default is admin", "admin")
/*  .option("-r, --recursive", "Import folders recursive")
  .option("-e, --empty", "Import empty albums")*/
  .action(function(directory, options)
  {
    var murrix = new Murrix(program);

    murrix.on("done", function()
    {
      // TODO: Solve this in a nicer way
      var session = {};
      session.document = {};
      session.document._id = 1;
      session.getId = function() { return session.document._id; };
      session.save = function(callback) { callback(); };

      murrix.user.becomeUser(session, options.user, function(error)
      {
        if (error)
        {
          murrix.logger.error("cmd", error);
          process.exit(1);
          return;
        }

        murrix.import.importDirectory(session, directory, options, function(error)
        {
          if (error)
          {
            murrix.logger.error("cmd", error);
            process.exit(1);
            return;
          }

          process.exit(0);
        });
      });
    });

    murrix.emit("init");
  }).on("--help", function() {
    console.log("  Examples:");
    console.log();
    console.log("    $ import ./my_pictures");
    console.log("    $ import -r ./my_pictures");
    console.log();
  });

program
  .command("*")
  .action(function(env){
    console.error("Unknown command");
    program.help();
  });

program.parse(process.argv);

if (program.args.length === 0)
{
  console.log("No command given");
  program.help();
}

//var murrix = new Murrix(program);
