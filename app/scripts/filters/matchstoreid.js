'use strict';

/**
 * @ngdoc filter
 * @name choroplethApp.filter:matchStoreId
 * @function
 * @description
 * # matchStoreId
 * Filter in the choroplethApp.
 */
angular.module('choroplethApp')
  .filter('matchStoreId', function () {
    return function (input, id) {
      if(!id) return input;
      var toReturn = [];
      angular.forEach(input, function (location) {
        if(location.storeId === id) toReturn.push(location);
      })
      return toReturn;
    };
  });
