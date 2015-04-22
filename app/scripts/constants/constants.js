'use strict';

angular.module('choroplethApp')

  /**
   * @ngdoc service
   * @name choroplethApp.GoogleApiKey
   * @description
   * # GoogleApiKey
   * Constant in the choroplethApp.
   */

  .constant('GoogleApiKey', 'AIzaSyDCffNlD97LJaKJPJwLDrqPtHcF-UkPQ3A')
  .constant('GoogleGeoCodeUrl', 'https://maps.googleapis.com/maps/api/geocode/json')
  .constant('GoogleMapsDirectionsUrl', 'https://www.google.com/maps/dir/')
  .constant('RangeColors', [ '#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'])

;
