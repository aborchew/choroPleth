'use strict';

/**
 * @ngdoc service
 * @name choroplethApp.GoogleURLs
 * @description
 * # GoogleURLs
 * Service in the choroplethApp.
 */
angular.module('choroplethApp')
  .service('GoogleURLs', function (GoogleMapsDirectionsUrl, GoogleGeoCodeUrl) {
    var service = {
      directions: function directions (from, to) {
        if(!to) {
          console.error('No Destination Provided for Directions Request.')
          return;
        }
        return GoogleMapsDirectionsUrl + (from ? from + '/' + to : 'Current+Location/' + to);
      },
      geoCode: function geoCode () {
        return GoogleGeoCodeUrl;
      }
    }
    return service;
  });
