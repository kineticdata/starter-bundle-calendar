// Below is an example of exposing a library globally so that it can be used in
// the content of a Kinetic Core form. The library itself will determine
// somewhat how this happens, for example some like the one shown below return
// something that you have to manually add to 'window'. Some libraries might add
// themselves to the window when loaded or some might decorate something else,
// like a jQuery plugin.
// Note that the example below shows jquery but jquery is not currently
// configured as a dependency so for this code to work jquery needs to be added
// as a dependency and installed.

import jquery from 'jquery';
import moment from 'moment';
import React from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from './components/calendar/Calendar';
import { KineticLib } from '@kineticdata/react';
import { store } from './redux/store';
import { Provider } from 'react-redux';

jquery.ajaxSetup({
  xhrFields: {
    withCredentials: true,
  },
});

window.$ = jquery;
window.jQuery = jquery;
window.moment = moment;

/**
 * Kinetic form customizations
 ******************************************************************************/

// Helper function to add help text to fields based on a render attribute
function addHelpTextToField(field, a, b, c) {
  var wrapper = jquery(field.wrapper());
  if (wrapper.is('[data-help-text]:not(:has(.help-text-wrapper))')) {
    wrapper.find('.field-label').after(
      jquery('<div>', {
        class: 'help-text-wrapper text-truncate',
      })
        .on('click', function() {
          jquery(this).toggleClass('text-truncate');
        })
        .append(
          window.K.translate(
            field.form().getTranslationContext(),
            wrapper.attr('data-help-text'),
          ),
        ),
    );
  }
}

window.bundle = window.bundle || {};
window.bundle.config = window.bundle.config || {};
// Create helpers namespace for importing the calendar configuration
window.bundle.helpers = window.bundle.helpers || {};

// Customization of form fields
window.bundle.config.fields = {
  text: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  checkbox: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  radio: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  dropdown: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  date: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  datetime: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  time: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
  attachment: {
    callback: function(field) {
      addHelpTextToField(field);
    },
  },
};

// Add functionality for detailed information toggle
window.bundle.config.ready = function(form) {
  var section = jquery(form.find('#detailedInformationSection'));
  if (section.length > 0) {
    section
      .find('.section-title')
      .css('cursor', 'pointer')
      .append('<div id="caret" class="fa fa-fw fa-caret-right"></div>')
      .click(function() {
        jquery(this)
          .find('#caret')
          .toggleClass('fa-caret-right fa-caret-down');
        section.find('#detailedInformation').toggle();
      });
  }
};

/**
 * Displays a calendar.
 *
 * @param options {
 *    div:              DOM Element *required*
 *        Element element the calendar is anchored to.
 * 
 *    calendarSlug:     Slug of calendar *required*
 *        The slug of the calendar, must match a calendar configuration
 *        in the calendar configuration datastore.
 *
 *    size:      Width of the window the calendar is render in. *recommended*
 *        The options are medium and large.
 *
 *    timezone:         Set the calendar initial timezone
 *
 *    title:            Add a title to the calendar
 */
window.bundle.helpers.calendar = (div, options = {}) => {
  if (!options.calendarSlug) {
    console.warn('The calendar requires calendarSlug');
    return;
  }

  ReactDOM.render(
    <KineticLib locale="en">
      <Provider store={store}>
        <Calendar
          kappSlug={options.kappSlug}
          formSlug={options.formSlug}
          slug={options.calendarSlug}
          size={options.size}
          timezone={options.timezone}
          title={options.title}
        />
      </Provider>
    </KineticLib>,
    div,
  );
};
