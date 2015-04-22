'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:LocationCtrl
 * @description
 * # LocationCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('LocationCtrl', function (
    $scope,
    $timeout,
    $q,
    $http,
    $modalInstance,
    $window,
    location,
    GoogleURLs
  ) {

    var address = (
        location.address + ' ' +
        location.addressLineTwo + ' ' +
        location.city + ' ' +
        location.stateAbbr + ' ' +
        location.postalCode
      ),
      validAddress = Boolean(location.address && location.city && location.stateAbbr),
      infoWindowContent = '<strong>' + location.address + '</strong><br/>' + location.city + ' ' + location.stateAbbr + ', ' + location.postalCode,
      input,
      autocomplete;

    function getLatLng () {

      var def = $q.defer();

      function getByAddress () {

        return $http({
          method: 'GET',
          url: GoogleURLs.geoCode(),
          params: { address: address }
        });

      }

      if(validAddress) {

        getByAddress()
          .then(function (httpObj) {
            def.resolve(httpObj.data.results[0].geometry.location);
            address = httpObj.data.results[0].formatted_address;
          }, function (error) {
            console.error(error);
          })

      } else if(location.latitude && location.longitude) {

        $timeout(function () {
          def.resolve({'lat': location.latitude, 'lng': location.longitude});
        }, 0);

      } else {
        def.reject('No valid address or lat/lng');
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
        marker = new google.maps.Marker({
          map: map,
          position: mapOptions.center,
          title: location.longName
        }),
        infowindow = new google.maps.InfoWindow({
          content: infoWindowContent
        }).open(map, marker);

        input = document.getElementById('pac-input');
        autocomplete = new google.maps.places.Autocomplete(input);

        angular.element(input).bind('blur', function () {
          $timeout(function () {
            if(autocomplete.getPlace()) {
              $scope.startAddr = autocomplete.getPlace().formatted_address;
            };
          }, 50);
        })

    };

    function getDirections (fromInput) {

      if(fromInput && $scope.placeSelected()) {
        var url = GoogleURLs.directions(autocomplete.getPlace().formatted_address, address);
      } else if(!fromInput) {
        var url = GoogleURLs.directions(null, address);
      }

      $window.open(url,'_blank');

    }

    getLatLng()
      .then(function (lat, lng) {
        drawMap(lat, lng);
      }, function (reason) {
        console.error(reason);
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
    $scope.getDirections = getDirections;
    $scope.placeSelected = function () { if(!autocomplete) return false; return autocomplete.getPlace(); };
    $scope.validAddress = validAddress;

  });
