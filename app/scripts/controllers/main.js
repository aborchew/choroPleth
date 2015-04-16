'use strict';

/**
 * @ngdoc function
 * @name choroplethApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the choroplethApp
 */
angular.module('choroplethApp')
  .controller('MainCtrl', function ($scope, $http, $q, $filter) {

    // @TODO (aborchew): Move these to a route/state resolve once we integrate with an actual application
    var mapReq = $http.get('scripts/us.json'),
      locationReq = $http.get('scripts/locationsList.json'),
      fipsReq = $http.get('scripts/fips.json'),
      width = 700,
      height = 400,
      scores = {},
      centered,
      g,
      path,
      svg,
      points,
      map,
      locations,
      fips;

    $q.all([mapReq, locationReq, fipsReq])
      .then(function (responses) {
        ready({
          map: responses[0].data,
          locations: responses[1].data,
          fips: responses[2].data
        });
      })

    // Map rendering

    function clickState () {

      var fipsToMatch = this.score.id,
        scoreMatch,
        stateData;

      angular.forEach(scores, function (score) {
        if(score.id === fipsToMatch) {
          scoreMatch = score;
        }
      })

      stateData = $filter('filter')(topojson.feature(map, map.objects.states).features, {id:fipsToMatch}, true)[0];
      stateData.score = scoreMatch;

      clicked(stateData);

    }

    // http://bl.ocks.org/mbostock/2206590
    function clicked(d) {

      var x, y, k, currentState, divisor;

      divisor = 2;

      if(!d.score) return;

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

      currentState = $filter('filter')(fips, {id:d.id})[0].name.toLowerCase();

      g.selectAll('path')
        .classed('active', centered && function(d) { return d === centered; });

      g.transition()
        .duration(750)
        .attr('transform', 'translate(' + width / divisor + ',' + height / divisor + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .style('stroke-width', 1.5 / k + 'px');

      points.transition()
        .duration(750)
        .attr('transform', 'translate(' + width / divisor + ',' + height / divisor + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
        .selectAll('circle.location')
          .attr('class', function (subD) {
            return centered && subD.state.toLowerCase() === currentState ? 'location visible' : 'location';
          })
          .duration(750)
          .attr('r', function () {
            return centered ? 1 : 0;
          })

    }

    function ready (responses) {

      map = responses.map,
      locations = responses.locations.response.rowsX,
      fips = responses.fips;

      var projection,
        color;

      projection = d3.geo.albersUsa()
        .scale(700)
        .translate([width / 2, height / 2]);

      path = d3.geo.path()
        .projection(projection);

      svg = d3.select('#map').append('svg')
        .attr('width', width)
        .attr('height', height);

      angular.forEach(locations, function (location) {

        var keyName = location.state.toLowerCase(),
          max = 100,
          min = 0,
          fipsMatch;

        location.metric = Math.floor(Math.random() * (max-min)) + min + 1;

        fipsMatch = $filter('filter')(fips, function (fipState) {
          return fipState.name.toLowerCase() == keyName;
        })

        if(!scores[keyName]) {
          scores[keyName] = {
            tallies: [location.metric]
          };
          scores[keyName].id = fipsMatch[0].id;
        } else {
          scores[keyName].tallies.push(location.metric);
        }

        location.fipsStateId = fipsMatch[0].id;

      });

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

      color = d3.scale.linear()
        .domain([actualMin(), actualMax()])
        .range(['red', 'green']);

      g = svg.append('g');

      g.append('g')
          .attr('class', 'states')
        .selectAll('path')
          .data(topojson.feature(map, map.objects.states).features)
        .enter().append('path')
          .attr('d', path)
          .attr('id', function (d) {
            return 'fips' + d.id;
          })
          .on('click', clicked)
          .attr('fill', function (state) {
            var stateMatch = $filter('filter')(fips, {id:state.id})[0];
            state.score = scores[stateMatch.name.toLowerCase()];
            if(state.score) {
              return color(state.score.score);
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

    }
    // End ready()

    $scope.scores = scores;
    $scope.clickState = clickState;

  });
