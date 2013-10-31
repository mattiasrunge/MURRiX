﻿
define(['knockout', 'murrix'], function(ko, murrix)
{
  var loading = ko.observable(false);
  var errorText = ko.observable("");
  var successText = ko.observable("");

  return {
    user: murrix.user,
    loading: loading,
    errorText: errorText,
    successText: successText,
  }
});
