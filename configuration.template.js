
var configuration = {};

configuration.databaseHost = "localhost";
configuration.databasePort = 27017;
configuration.databaseName = "murrix";
configuration.httpPort = 8080;
configuration.filesPath = "../files/";
configuration.mediaCachePath = "../cache/";
configuration.sessionName = "murrix";

exports.Configuration = configuration;