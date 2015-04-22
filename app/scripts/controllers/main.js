'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('MainCtrl', function ($scope, $http, $q, $filter, $window, $timeout, $modal, $location, RangeColors) {

    // @TODO (aborchew): Move these to a route/state resolve once we integrate with an actual application
    var mapReq = $http.get('scripts/us.json'),
      locationReq = $http.get('scripts/locationsList.json'),
      rangeColors = RangeColors,
      width,
      height,
      scores = [],
      centered,
      previousCentered,
      g,
      path,
      svg,
      points,
      map,
      locations,
      fips,
      stateColor,
      getScoreColor,
      resizeInterval,
      resizeTimeout = false,
      resizeDelta = 250,
      transTime = 750,
      locationLocked = false,
      reverseOrder = true,
      totalOrAverage = 'average',
      comparator = 'average';

    $q.all([mapReq, locationReq])
      .then(function (responses) {

        map = responses[0].data;
        locations = responses[1].data.response.rowsX;

        angular.forEach(locations, function (location) {

          var stateId = location.stateId,
            max = 10000,
            min = 1,
            scoreMatch = $filter('filter')(scores, {id:stateId}, true);

          location.metric = Math.floor(Math.random() * (max-min)) + min + 1;

          if(scoreMatch.length !== 1) {
            scores.push({
              'tallies': [location.metric],
              'stateName': location.state,
              'id': stateId
            });
          } else {
            scoreMatch[0].tallies.push(location.metric);
          }

        });

        angular.forEach(scores, function (score) {

          var scoreDomainMin = d3.min(score.tallies),
            scoreDomainMax = d3.max(score.tallies),
            scoreDomainAvg = (scoreDomainMin + scoreDomainMax) / 2;

          score.colorScale = d3.scale.linear()
            .domain([
              scoreDomainMin,
              (scoreDomainAvg + scoreDomainMin) / 2,
              scoreDomainAvg,
              (scoreDomainAvg + scoreDomainMax) / 2,
              scoreDomainMax
            ])
            .range(rangeColors);

          score.legendLabels = [
            '<= ' + Math.floor(score.colorScale.domain()[0]),
            Math.floor(score.colorScale.domain()[1]) + ' +',
            Math.floor(score.colorScale.domain()[2]) + ' +',
            Math.floor(score.colorScale.domain()[3]) + ' +',
            '>= ' + Math.floor(score.colorScale.domain()[4])
          ]

        })

        ready();
        parseSearchParams();

      })

    function getStateName (id) {
      return $filter('filter')(scores, {id:id}, true)[0].stateName;
    }

    function getStateRangeLabel (id) {
      return $filter('filter')(scores, {id:id}, true)[0].legendLabels;
    }

    function getStateColor (score) {
      return stateColor ? stateColor(score) : 'inherit';
    }

    function getScoreColor (score, stateId) {
      var scoreMatch = $filter('filter')(scores, {id: stateId}, true);
      if(scoreMatch.length !== 1 || !scoreMatch[0].colorScale) return 'inherit';
      return (scoreMatch[0].colorScale(score));
    }

    function clickState (stateId) {

      var fipsId = parseInt(stateId) || this.score.id,
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
        divisor,
        scoreMatch = $filter('filter')(scores, {id:d.id}, true);

      divisor = 2;

      if(!d || !d.id || scoreMatch.length !== 1) return;

      if (d && ((centered && centered.id !== d.id) || !centered)) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
        $location.search('s', d.id);
      } else {
        x = width / divisor;
        y = height / divisor;
        k = 1;
        centered = null;
        $location.search('s', null);
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

    function stateHover () {

      var state = svg.select('[data-state-id=state' + this.score.id + ']');
      state
        .classed('hovered', true)

    }

    function stateHoverOut () {

      var state = svg.select('[data-state-id=state' + this.score.id + ']');
      state
        .classed('hovered', false)

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

    // Render map
    function ready () {

      var projection;

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
        state.total = state.tallies.reduce(function (previous, current) {
          return previous + current;
        }, 0)
        state.average = state.total / state.tallies.length;
      })

      function actualMin () {
        return ;
      }

      function actualMax () {
        return d3.max(scores, function (d) { return d[totalOrAverage] });
      }

      var stateDomainMin = d3.min(scores, function (d) { return d[totalOrAverage] }),
        stateDomainMax = d3.max(scores, function (d) { return d[totalOrAverage] }),
        stateDomainAvg = (stateDomainMax + stateDomainMin) / 2,
        legendLabels;

      stateColor = d3.scale.linear()
        .domain([
          stateDomainMin,
          (stateDomainAvg + stateDomainMin) / 2,
          stateDomainAvg,
          (stateDomainAvg + stateDomainMax) / 2,
          stateDomainMax
        ])
        .range(rangeColors);

      legendLabels = [
        '<= ' + Math.floor(stateColor.domain()[0]),
        Math.floor(stateColor.domain()[1]) + ' +',
        Math.floor(stateColor.domain()[2]) + ' +',
        Math.floor(stateColor.domain()[3]) + ' +',
        '>= ' + Math.floor(stateColor.domain()[4])
      ]

      g = svg.append('g');

      g.append('g')
          .attr('class', 'states')
        .selectAll('path')
          .data(topojson.feature(map, map.objects.states).features)
        .enter().append('path')
          .attr('d', path)
          .on('click', clicked)
          .attr('data-state-id', function (d) {
            return 'state' + d.id;
          })
          .attr('fill', function (d) {
            var scoreMatch = $filter('filter')(scores, {id:d.id}, true)
            if(scoreMatch.length === 1) {
              d.hasScore = true;
              d.scoreColor = stateColor(scoreMatch[0][totalOrAverage]);
              return d.scoreColor;
            }
          })
          .classed('state', function (d) {
            return d.hasScore;
          })
          .on('mouseover', function (d) {
            if(!d.hasScore) return;
            d3.select(this)
              .classed('hovered', true);
          })
          .on('mouseout', function (d) {
            if(!d.hasScore) return;
            d3.select(this)
              .classed('hovered', false)
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
        .data(stateColor.domain())
        .enter().append('g')
        .attr('class', 'legend');

        var ls_w = 20, ls_h = 20;

        legend.append('rect')
          .attr('x', 20)
          .attr('y', function(d, i){ return height - (i*ls_h) - 2*ls_h;})
          .attr('width', ls_w)
          .attr('height', ls_h)
          .style('fill', function(d, i) { return stateColor(d); })
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

    function parseSearchParams () {
      angular.forEach($location.search(), function (val, key) {
        switch(key) {
          case 'l':
            var locationMatch = $filter('filter')(locations, {storeId: val}, true)
            if(locationMatch.length === 1) {
              openLocation(locationMatch[0])
            } else {
              $location.search('l', null);
            }
            break;
          case 's':
            clickState(val)
            break;
        }
      })
    }

    function openLocation (location) {

      var location = location || this.location;

      $location.search('l', location.storeId);

      var modalInstance = $modal.open({
        templateUrl: 'views/location.html',
        controller: 'LocationCtrl',
        size: 'lg',
        resolve: {
          location: function () {
            return location;
          }
        }
      });

      modalInstance.result.then(function () {
        // Confirm
        $location.search('l', null);
      }, function () {
        // Cancel
        $location.search('l', null);
      });

    }

    $scope.scores = scores;
    $scope.getLocations = function () { return locations; };
    $scope.getSvgHeight = function () { return height; };
    $scope.stateHover = stateHover;
    $scope.stateHoverOut = stateHoverOut;
    $scope.clickState = clickState;
    $scope.locationHover = locationHover;
    $scope.locationHoverOut = locationHoverOut;
    $scope.openLocation = openLocation;
    $scope.getStateColor = getStateColor;
    $scope.getScoreColor = getScoreColor;
    $scope.rangeColors = rangeColors;
    $scope.getStateName = getStateName;
    $scope.getStateRangeLabel = getStateRangeLabel;
    $scope.comparator = comparator;
    $scope.reverseOrder = reverseOrder;
    $scope.totalOrAverage = totalOrAverage;

  });
