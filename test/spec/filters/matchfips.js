'use strict';

describe('Filter: matchFIPS', function () {

  // load the filter's module
  beforeEach(module('choroplethApp'));

  // initialize a new instance of the filter before each test
  var matchFIPS;
  beforeEach(inject(function ($filter) {
    matchFIPS = $filter('matchFIPS');
  }));

  it('should return the input prefixed with "matchFIPS filter:"', function () {
    var text = 'angularjs';
    expect(matchFIPS(text)).toBe('matchFIPS filter: ' + text);
  });

});
