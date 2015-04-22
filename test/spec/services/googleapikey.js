'use strict';

describe('Service: GoogleApiKey', function () {

  // load the service's module
  beforeEach(module('choroplethApp'));

  // instantiate service
  var GoogleApiKey;
  beforeEach(inject(function (_GoogleApiKey_) {
    GoogleApiKey = _GoogleApiKey_;
  }));

  it('should do something', function () {
    expect(!!GoogleApiKey).toBe(true);
  });

});
