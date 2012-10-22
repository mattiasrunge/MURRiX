
var configuration = {};

configuration.databaseHost = "localhost";
configuration.databasePort = 27017;
configuration.databaseName = "murrix";
configuration.httpPort = 8080;
configuration.filesPath = "../files/";
configuration.previewsPath = "../previews/";
configuration.sessionName = "murrix";

exports.Configuration = configuration;