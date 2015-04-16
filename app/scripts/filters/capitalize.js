'use strict';

/**
 * @ngdoc filter
 * @name choroplethApp.filter:capitalize
 * @function
 * @description
 * # capitalize
 * Filter in the choroplethApp.
 */
angular.module('choroplethApp')
  .filter('capitalize', function () {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
  });
