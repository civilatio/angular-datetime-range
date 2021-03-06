'use strict';

angular.module('g1b.datetime-range', ['g1b.scroll-events']).
  directive('datetimeRange', ['$document', '$timeout', function ($document, $timeout) {

  return {
    restrict: 'E',
    scope: {
      start: '=',
      end: '=',
      presets: '=?',
      minDate:'=?',
      maxDate:'=?',
      onChange: '&?',
      onChangeStart: '&?',
      onChangeEnd: '&?',
      onClose: '&?',
      closeText: '@',
      clearText: '@',
      infiniteStart: '<',
      infiniteEnd: '<'
    },
    replace: true,
    templateUrl: './datetime-range.html',
    compile: function () {
      return {
        pre: function preLink() {},
        post: function postLink(scope, element) {

          // Set default values
          if (typeof scope.infiniteStart === 'undefined') scope.infiniteStart = false;
          if (typeof scope.infiniteEnd === 'undefined') scope.infiniteEnd = false;

          // Get current date
          scope.current = moment();

          // Convert start datetime to moment.js if its not a moment object yet
          if ( scope.start && !scope.start._isAMomentObject ) {
            scope.start = moment(scope.start);
          }

          // Convert end datetime to moment.js if its not a moment object yet
          if ( scope.end && !scope.end._isAMomentObject ) {
            scope.end = moment(scope.end);
          }

          // Get number of weeks in month
          scope.getNumWeeks = function () {
            if ( !scope.calendar ) { return; }

            var firstDayOfWeek = scope.calendar.clone().startOf('week').weekday();

            var firstOfMonth = scope.calendar.clone().startOf('month');
            var lastOfMonth = scope.calendar.clone().endOf('month');

            var firstWeekDay = (firstOfMonth.weekday() - firstDayOfWeek + 7) % 7;

            return Math.ceil((firstWeekDay + scope.calendar.daysInMonth()) / 7);
          };

          // Set selected date
          scope.selectDate = function (date) {
            if (date === 'start') {
              scope.calendar = scope.start ? scope.start.clone() : moment();
            } else {
              scope.calendar = scope.end ? scope.end.clone() : moment();
            }
            scope.selected = date;
            scope.presetsActive = false;
          };

          // Check if date is within bounds of min and max allowed date
          scope.isWithinBounds = function (date) {
            return  ( !scope.minDate || date > scope.minDate ) && ( !scope.maxDate || date < scope.maxDate );
          };

          // Update selected date
          scope.setDate = function (date) {
            if ( !scope.isWithinBounds(date) ) {
              return;
            }

            if ( ( !scope.start || !scope.end ) ||
              ( scope.selected === 'start' && date.isBefore(scope.end) ) || ( scope.selected === 'end' && date.isAfter(scope.start) ) ) {

              scope.calendar = date.clone();

              if (scope.selected === 'start') {
                scope.start = scope.calendar.clone();
                scope.callbackStart();
              } else {
                scope.end = scope.calendar.clone();
                scope.callbackEnd();
              }

              scope.callbackAll();
            } else {
              scope.warning = scope.selected === 'start' ? 'end' : 'start';
              $timeout(function () {
                scope.warning = undefined;
              }, 250);
            }
          };

          scope.clear = function() {
           if (scope.selected === 'start') {
             if (!scope.infiniteStart) return;
             scope.start = undefined;
           } else {
             if (!scope.infiniteEnd) return;
             scope.end = undefined;
           }
          };

          // Set start and end datetime objects to the selected preset
          scope.selectPreset = function (preset) {
            // Hide presets menu on select
            scope.close();

            // Don't do anything if nothing is changed
            if ( scope.start.isSame(preset.start) && scope.end.isSame(preset.end) ) { return; }

            // Update start datetime object if changed
            if ( !scope.start.isSame(preset.start) ) {
              scope.start = preset.start.clone();
              scope.callbackStart();
            }

            // Update end datetime object if changed
            if ( !scope.end.isSame(preset.end) ) {
              scope.end = preset.end.clone();
              scope.callbackEnd();
            }

            // Something has definitely changed, fire ambiguous callback
            scope.callbackAll();
          };

          // Callbacks fired on change of start datetime object
          scope.callbackStart = function () {
            if ( !!scope.onChangeStart ) {
              $timeout(function () {
                scope.onChangeStart();
              });
            }
          };

          // Callbacks fired on change of end datetime object
          scope.callbackEnd = function () {
            if ( !!scope.onChangeEnd ) {
              $timeout(function () {
                scope.onChangeEnd();
              });
            }
          };

          // Callbacks fired on change of start and/or end datetime objects
          scope.callbackAll = function () {
            if ( !!scope.onChange ) {
              $timeout(function () {
                scope.onChange();
              });
            }
          };

          // Close edit popover
          scope.close = function () {
            scope.selected = '';
            scope.presetsActive = false;
            scope.calendarActive = false;

            if ( !!scope.onClose ) {
              scope.onClose();
            }
          };

          // Bind click events outside directive to close edit popover
          $document.on('mousedown', function (e) {
            if ( !element[0].contains(e.target) && (!!scope.presetsActive || !!scope.selected) ) {
              scope.$apply(function () {
                scope.close();
              });
            }
          });

          // Bind 'esc' keyup event to close edit popover
          $document.on('keyup', function (e) {
            if ( e.keyCode === 27 && (!!scope.presetsActive || !!scope.selected) ) {
              scope.$apply(function () {
                scope.close();
              });
            }
          });
        }
      };
    }
  };
}]);
