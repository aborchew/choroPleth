'use strict';

/**
 * @ngdoc filter
 * @name choroplethApp.filter:matchFIPS
 * @function
 * @description
 * # matchFIPS
 * Filter in the choroplethApp.
 */
angular.module('choroplethApp')
  .filter('matchFIPS', function ($filter) {
    return function (input, id) {
      if(!id) return input;
      var toReturn = [];
      angular.forEach(input, function (score) {
        if(score.id === id) toReturn.push(score);
      })
      return toReturn;
    };
  });
