'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('MainCtrl', function ($scope, $http, $q, $filter, $window, $timeout) {

    // @TODO (aborchew): Move these to a route/state resolve once we integrate with an actual application
    var mapReq = $http.get('scripts/us.json'),
      locationReq = $http.get('scripts/locationsList.json'),
      width,
      height,
      scores = {},
      centered,
      previousCentered,
      g,
      path,
      svg,
      points,
      map,
      locations,
      fips,
      color,
      resizeInterval,
      resizeTimeout = false,
      resizeDelta = 250,
      transTime = 750,
      locationLocked = false;

    $q.all([mapReq, locationReq])
      .then(function (responses) {

        map = responses[0].data;
        locations = responses[1].data.response.rowsX;

        angular.forEach(locations, function (location) {

          var stateId = location.stateId,
            max = 100,
            min = 0;

          location.metric = Math.floor(Math.random() * (max-min)) + min + 1;

          if(!scores[stateId]) {
            scores[stateId] = {
              'tallies': [location.metric],
              'stateName': location.state,
              'id': stateId
            };
          } else {
            scores[stateId].tallies.push(location.metric);
          }

        });

        ready()

      })

    function getColor (score) {
      return color ? color(score) : 'inherit';
    }

    function clickState () {

      var fipsId = this.score.id,
        stateData = $filter('filter')(topojson.feature(map, map.objects.states).features, {id:fipsId}, true)[0];

      clicked(stateData);

    }

    // http://bl.ocks.org/mbostock/2206590
    function clicked(d) {

      locationLocked = false;
      $scope.selectedStore = null;

      var x,
        y,
        k,
        divisor;

      divisor = 2;

      if(!d || !d.id || !scores[d.id]) return;

      if (d && ((centered && centered.id !== d.id) || !centered)) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
      } else {
        x = width / divisor;
        y = height / divisor;
        k = 1;
        centered = null;
      }

      g.selectAll('path')
        .classed('active', centered && function(d) { return d === centered; });

      g.transition()
        .duration(transTime)
        .attr('transform', 'translate(' + width / divisor + ',' + height / divisor + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .style('stroke-width', 1.5 / k + 'px');

      points.transition()
        .duration(transTime)
        .attr('transform', 'translate(' + width / divisor + ',' + height / divisor + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .selectAll('circle.location')
          .attr('class', function (subD) {
            return centered && subD.stateId === centered.id ? 'location visible' : 'location';
          })
          .attr('r', function (subD) {
            return centered && subD.stateId === centered.id ? 1 : 0;
          })
          .attr('data-store-id', function (subD) {
            return 'store' + subD.storeId;
          })

      transTime = 750;

      $timeout(function () {
        $scope.selectedStateId = centered ? centered.id : null;
      }, 0);

    }

    function locationHover () {

      if(locationLocked) return;

      var storeId = this.location.storeId,
        loc = points.select('[data-store-id=store' + storeId + ']');

      points.selectAll('circle.location').sort(function (a, b) {
        if(a.storeId !== storeId) return -1;
        return 1;
      })

      loc
        .classed('hovered', true)
        .transition()
        .duration(500)
        .attr('r', 5)
    }

    function locationHoverOut () {

      if(locationLocked) return;

      var storeId = this.location.storeId,
        loc = points.select('[data-store-id=store' + storeId + ']');

      loc
        .classed('hovered', false)
        .transition()
        .duration(500)
        .attr('r', 1)
    }

    function lockLocation () {
      locationLocked = !locationLocked;
      if(locationLocked) {
        $scope.selectedStore = this.location.storeId;
      } else {
        $scope.selectedStore = null;
      }
    }

    // Render map
    function ready () {

      var projection;

      // angular.forEach(locations, function (location) {
      //   var fipsMatch = $filter('filter')(fips, function (fipState) {
      //     return fipState.name.toLowerCase() == location.state.toLowerCase();
      //   })
      //   location.stateAbbr = fipsMatch[0].abbr;
      //   location.stateId = fipsMatch[0].id;
      // })

      // console.log(angular.toJson(locations));

      width = angular.element('#map').width();
      height = width * .65;

      if(!width) {
        $timeout(ready, 0);
        return;
      }

      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

      path = d3.geo.path()
        .projection(projection);

      svg = d3.select('#map').append('svg')
        .attr('width', width)
        .attr('height', height);

      angular.forEach(scores, function (state) {
        state.score = state.tallies.reduce(function (previous, current) {
          return previous + current;
        }, 0) / state.tallies.length;
      })

      function actualMin () {
        var min;
        angular.forEach(scores, function (state) {
          if(!min || state.score < min) {
            min = state.score;
          }
        })
        return min;
      }

      function actualMax () {
        var max;
        angular.forEach(scores, function (state) {
          if(!max || state.score > max) {
            max = state.score;
          }
        })
        return max;
      }

      var rangeMin = actualMin(),
        rangeMax = actualMax(),
        avg = (rangeMax + rangeMin) / 2,
        legendLabels;

      color = d3.scale.linear()
        .domain([
          rangeMin,
          (avg + rangeMin) / 2,
          avg,
          (avg + rangeMax) / 2,
          rangeMax
        ])
        .range([
          '#d7191c',
          '#fdae61',
          '#ffffbf',
          '#a6d96a',
          '#1a9641'
        ]);

      legendLabels = [
          '<= ' + Math.floor(color.domain()[0]),
          Math.floor(color.domain()[1]) + ' +',
          Math.floor(color.domain()[2]) + ' +',
          Math.floor(color.domain()[3]) + ' +',
          '>= ' + Math.floor(color.domain()[4])
        ]

      g = svg.append('g');

      g.append('g')
          .attr('class', 'states')
        .selectAll('path')
          .data(topojson.feature(map, map.objects.states).features)
        .enter().append('path')
          .attr('d', path)
          .on('click', clicked)
          .attr('fill', function (state) {
            if(scores[state.id]) {
              return color(scores[state.id].score);
            }
          })

      g.append('path')
        .datum(topojson.mesh(map, map.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'state-borders')
        .attr('d', path);

      points = svg.append('g');

      points.selectAll('circle.location')
        .data(locations)
        .enter()
        .append('circle')
        .attr('class', 'location')
        .attr('r', 1)
        .attr('transform', function(d) {
          return 'translate(' + projection([d.longitude, d.latitude]) + ')';
        })

      var legend = svg.selectAll('g.legend')
        .data(color.domain())
        .enter().append('g')
        .attr('class', 'legend');

        var ls_w = 20, ls_h = 20;

        legend.append('rect')
          .attr('x', 20)
          .attr('y', function(d, i){ return height - (i*ls_h) - 2*ls_h;})
          .attr('width', ls_w)
          .attr('height', ls_h)
          .style('fill', function(d, i) { return color(d); })
          .style('opacity', 0.8);

        legend.append('text')
          .attr('x', 50)
          .attr('y', function(d, i){ return height - (i*ls_h) - ls_h - 4;})
          .text(function(d, i){ return legendLabels[i]; });


    }
    // End ready()

    $window.onresize = function() {
      previousCentered = centered;
      resizeInterval = new Date();
      svg.classed('resizing', true);
      if (resizeTimeout === false) {
        resizeTimeout = true;
        setTimeout(resizeSVG, resizeDelta);
      };
    };

    function resizeSVG () {

      if (new Date() - resizeInterval < resizeDelta) {
        setTimeout(resizeSVG, resizeDelta);
      } else {
        svg.classed('resizing', false);
        resizeTimeout = false;
        svg.remove();
        centered = null;
        ready()
        if(previousCentered) {
          transTime = 0;
          clicked(previousCentered);
          previousCentered = null;
        }
      }
    }

    $scope.scores = scores;
    $scope.getLocations = function () { return locations; };
    $scope.getSvgHeight = function () { return height; };
    $scope.clickState = clickState;
    $scope.locationHover = locationHover;
    $scope.locationHoverOut = locationHoverOut;
    $scope.lockLocation = lockLocation;
    $scope.getColor = getColor;

  });
