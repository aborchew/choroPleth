'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:LocationCtrl
 * @description
 * # LocationCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('LocationCtrl', function ($scope, $timeout, $q, $http, $modalInstance, location) {

    function getLatLng () {

      var def = $q.defer();

      if(location.latitude && location.longitude) {

        $timeout(function () {
          def.resolve({'lat': location.latitude, 'lng': location.longitude});
        }, 0);

      } else {

        var address =
          location.address + ' ' +
          location.addressLineTwo + ' ' +
          location.city + ' ' +
          location.stateAbbr + ' ' +
          location.postalCode;

        $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyDCffNlD97LJaKJPJwLDrqPtHcF-UkPQ3A')
          .then(function (data) {
            console.log(data);
          })

      }

      return def.promise;

    }

    function drawMap (LatLng) {

      var mapCanvas = document.getElementById('mapCanvas'),
        mapOptions = {
          center: new google.maps.LatLng(LatLng.lat, LatLng.lng),
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        map = new google.maps.Map(mapCanvas, mapOptions),
        infowindow = new google.maps.Marker({
          map: map,
          position: mapOptions.center,
          title: location.longName
        });

    };

    getLatLng()
      .then(function (lat, lng) {
        drawMap(lat, lng);
      })

    function ok () {
      $modalInstance.close();
    };

    function cancel () {
      $modalInstance.dismiss();
    };

    $scope.ok = ok;
    $scope.cancel = cancel;
    $scope.location = location;

  });
