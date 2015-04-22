'use strict';

describe('Service: GoogleURLs', function () {

  // load the service's module
  beforeEach(module('choroplethApp'));

  // instantiate service
  var GoogleURLs;
  beforeEach(inject(function (_GoogleURLs_) {
    GoogleURLs = _GoogleURLs_;
  }));

  it('should do something', function () {
    expect(!!GoogleURLs).toBe(true);
  });

});
