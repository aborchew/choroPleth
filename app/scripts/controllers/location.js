'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:LocationCtrl
 * @description
 * # LocationCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('LocationCtrl', function ($scope, $modalInstance) {

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };

  });
