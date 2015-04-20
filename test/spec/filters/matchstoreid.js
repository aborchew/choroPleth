'use strict';

describe('Filter: matchStoreId', function () {

  // load the filter's module
  beforeEach(module('choroplethApp'));

  // initialize a new instance of the filter before each test
  var matchStoreId;
  beforeEach(inject(function ($filter) {
    matchStoreId = $filter('matchStoreId');
  }));

  it('should return the input prefixed with "matchStoreId filter:"', function () {
    var text = 'angularjs';
    expect(matchStoreId(text)).toBe('matchStoreId filter: ' + text);
  });

});
