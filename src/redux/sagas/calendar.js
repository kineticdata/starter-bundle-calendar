import { call, put, all, select, takeEvery } from 'redux-saga/effects';
import { fetchBridgedResource, fetchForm } from '@kineticdata/react';
import { generateKey, bundle } from '@kineticdata/react';
import { OrderedMap, Map, fromJS } from 'immutable';
import axios from 'axios';
import moment from 'moment';

import { actions, types } from '../modules/calendar';
import {
  getDateRange,
  getStartDate,
  getEndDate,
  buildFilterActions,
  updateEvents,
  updateFilterOptions,
  setEventsColor,
} from '../../components/calendar/calendarHelpers';

/********************* Helpers *********************/
export const parseJson = (jsonString, isLog) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // TODO: better handle error.
    if (isLog) {
      console.log(e, jsonString);
    }
    return false;
  }
};

export const convertBool = allDayValue =>
  allDayValue.toLowerCase().trim() === 'true' ? true : false;

export const getResources = (acc, mapping, key, date, calendarView) => {
  let values = {};

  // Different sources have different parameters required to get dates in a range.
  if (mapping.has('parameters')) {
    values = mapping.get('parameters').reduce((acc, fieldObj, key) => {
      switch (key) {
        case 'Date Range':
          return { ...getDateRange(fieldObj, date, calendarView), ...acc };
        case 'Start Date':
          return { ...getStartDate(fieldObj, date, calendarView), ...acc };
        case 'End Date':
          return { ...getEndDate(fieldObj, date, calendarView), ...acc };
        default:
          return acc;
      }
    }, {});
    mapping = mapping.remove('parameters');
  }

  // fetch events.
  acc[key] = call(fetchBridgedResource, {
    ...mapping.toJS(),
    values,
  });
  return acc;
};

/**
 * Format the detail value for use with event title.
 *
 * @param {object} detail
 * @param {string} timezone
 */
export const getFormatDetail = (detail, timezone) =>
  detail.type === 'date-time'
    ? timezone === false
      ? moment(detail.value).format(detail.format)
      : moment(detail.value)
          .tz(timezone)
          .format(detail.format)
    : detail.value;

/**
 * Return the core mapping property correctly formatted to be used by the full
 * calendar components.
 *  * start and end are new date format,
 *  * all day is a boolean value,
 *  * title can be a concatenation of bridge attributes and related data.
 *
 * @param {*} property
 * @param {object} event
 * @param {object} coreMapping
 * @param {Immutable Map} details
 * @param {string} timezone
 * @returns
 */
export const getFormatProperty = (
  property,
  event,
  coreMapping,
  details,
  timezone,
) => {
  switch (property) {
    case 'start':
    case 'end':
      // timezone can be set to false to indicate no timezone
      return timezone
        ? new Date(event[coreMapping[property]])
        : new Date(event[coreMapping[property]]).toISOString();
    case 'allDay':
      return convertBool(event[coreMapping[property]]);
    case 'title':
      // The title can be an array of literal strings, event values, or details
      return Array.isArray(coreMapping[property])
        ? coreMapping[property]
            .map(ele => {
              // Array element was configured in detail mapping.
              if (details.has(ele)) {
                ele =
                  typeof details.get(ele) === 'object'
                    ? // Detail that are objects have been transformed.
                      Array.isArray(details.get(ele).value)
                      ? // The detail is configured for multiValue.
                        details.get(ele).value.join(' ')
                      : (ele = getFormatDetail(details.get(ele), timezone))
                    : details.get(ele);
                // Array element was an attribute on the bridge request.
              } else if (event.hasOwnProperty(ele)) {
                ele = event[ele];
              }
              return ele;
            })
            .join('')
        : details.has(coreMapping[property])
        ? details.get(coreMapping[property])
        : event[coreMapping[property]]
        ? event[coreMapping[property]]
        : coreMapping[property];
    default:
      return event[coreMapping[property]];
  }
};

export const convertRecurring = (event, coreMapping) => {
  if (event['recurring'] === 'daily') {
    // Get Duration (https://thewebdev.info/how-to-get-the-hour-difference-between-two-times-with-moment-js)
    const startTime = moment(
      moment(event.start).format('HH:mm:ss a'),
      'HH:mm:ss a',
    );
    const endTime = moment(
      moment(event.end).format('HH:mm:ss a'),
      'HH:mm:ss a',
    );
    const duration = moment.duration(endTime.diff(startTime));
    const hourDuration = parseInt(duration.asHours());
    let minuteDuration = parseInt(duration.asMinutes()) % 60;

    // Ensure there are always at least two digits
    minuteDuration = ('0' + minuteDuration).slice(-2);

    event = {
      ...event,
      duration: `${hourDuration}:${minuteDuration}`,
      rrule: {
        freq: 'daily',
        interval: 1,
        dtstart: event.start,
        until: event.end,
      },
    };
  }

  return event;
};
/***************************************************/

export function* fetchCalendarConfigSaga({ payload }) {
  // Fetch timezones
  yield call(fetchLocaleMetaTask);

  const { kappSlug, formSlug } = payload;

  const { form, error } = yield call(fetchForm, {
    kappSlug,
    formSlug,
    include: 'details,attributesMap',
  });

  if (error) {
    // TODO handle error
  } else {
    if (form) {
      // Parse configuration
      // Calendar Config is a single attribute so we can use the intial index
      const config = parseJson(form.attributesMap['Calendar Config'][0], true);
      let { eventTypes, ...calendarConfig } = config;
      eventTypes =
      eventTypes &&
      eventTypes
          .filter(source => source.valid)
          .reduce((acc, sourceConfig) => {
            const key = generateKey();
            const sourceResource = { kappSlug, formSlug, ...sourceConfig.source };
            return acc.set(
              key,
              fromJS({
                name: sourceConfig.name ? sourceConfig.name : '--Blank--',
                color: sourceConfig.color ? sourceConfig.color : null,
                // TODO: if prop exists what do we do?  question open to Matt H
                defaultFilter: sourceConfig.defaultFilter,
                source: sourceResource,
                coreMapping: sourceConfig.coreMapping
                  ? sourceConfig.coreMapping
                  : {},
                detailMapping: sourceConfig.detailMapping
                  ? OrderedMap(sourceConfig.detailMapping)
                  : {},
                filterMapping: sourceConfig.filterMapping
                  ? sourceConfig.filterMapping.map(filter => ({
                      ...filter,
                      id: generateKey(),
                      values: filter.values,
                    }))
                  : [],
              }),
            );
          }, Map());

      // Parse Calendar Config data
      yield put(
        actions.fetchCalendarEvents({
          key: payload.key,
          sources: eventTypes,
          timezone: payload.timezone,
        }),
      );
      yield put(
        actions.fetchCalendarConfigSuccess({
          key: payload.key,
          sources: eventTypes,
          calendarConfig,
        }),
      );
    } else {
      // TODO: Throw error that config was not found.
    }
  }
}

/*
  Save this code for potential error handling in the fetchCalendarEventsSaga

  // Separate successful from errors responses.
  const responseErrors = Map(response).filter(resource => !!resource.error);
  const responseSuccess = Map(response).filter(resource => !resource.error);

  if (responseErrors.size > 0) {
    // TODO: Handle Error
  }
*/

/**
 * This saga is called when the calendar is initialized and when the user
 * navigates between months, days, years.  We fetch the current month events
 * with a week cushion on either end of the month. If there are related data
 * resources they are also fetched.
 *
 * @param {*} param0
 */
export function* fetchCalendarEventsSaga({ payload }) {
  // TODO: Investigate why we clear events.  Comment here if need or delete.
  if (!payload.refetch) {
    yield put(
      actions.fetchCalendarEventsSuccess({ key: payload.key, events: [] }),
    );
  }

  // Build a map of bridge resources to get all sources' events.
  const resources = payload.sources.reduce((acc, source, key) => {
    const sourceMapping = source.get('source');
    return getResources(
      acc,
      sourceMapping,
      key,
      payload.date,
      payload.calendarView,
    );
  }, {});

  // Make Bridge calls. The response is a JS Object of requested responses.
  // Each request responses has a unique key.
  const response = yield all({ ...resources });

    // Separate successful from errors responses.
    const responseErrors = Map(response).filter(resource => !!resource.error).toJS();
    const responseSuccess = Map(response).filter(resource => !resource.error).toJS();
  
    if (responseErrors.size > 0) {
      // May want to update the error handling as preferred
      console.log(`There were ${responseErrors.size} events with errors that we are unable to display.`)
    }

  // Combine all events from each source and reformat to the needs of the calendar.
  let events = Object.keys(responseSuccess ? responseSuccess : {}).reduce((acc, key) => {
    const coreMapping = payload.sources
      .get(key)
      .get('coreMapping')
      .toJS();

    // These are event details shown in modals.  They also contain detail formatting.
    const detailMapping = OrderedMap(
      payload.sources.get(key).get('detailMapping'),
    );

    let localEvents = response[key].records && response[key].records.map(event => {
      const details = detailMapping.map(detail => {
        let value;
        if (typeof detail === 'object') {
          let eventValue;
          if (detail.type === 'multiValue') {
            eventValue = parseJson(event[detail.attributeName]);
          } else if (detail.type === 'compound') {
            const delimiter = detail.delimiter ? detail.delimiter : null;
            eventValue = detail.attributeName
              .map(attr => event[attr])
              .join(delimiter);
          } else {
            eventValue = event[detail.attributeName];
          }
          value = {
            ...detail,
            value: eventValue ? eventValue : '_BLANK_',
          };
        } else {
          value = event[detail] ? event[detail] : '_BLANK_';
        }

        return value;
      });

      // TODO: convert the return object to an immutable Map.
      // The object is passed to EventModal for users to customize their modals.
      // It's inconstant to have details as a Map and the event(return object) as an object
      event = {
        // default that all events display when calendar renders.
        filter: false,
        key,
        ...Object.keys(coreMapping).reduce((acc, property) => {
          acc[property] = getFormatProperty(
            property,
            event,
            coreMapping,
            details,
            payload.timezone,
          );
          return acc;
        }, {}),
        details,
      };

      if (event['recurring'] && event['recurring'] !== 'not recurring') {
        event = convertRecurring(event, coreMapping);
      }

      // Any event that does not have a preset allDay value and is longer than 24 hrs sets allDay: true
      if (!event.allDay && ((event.end.getTime() - event.start.getTime()) / 1000 / 60) >= 1440) {
        event.allDay = true;
      }

      return event;
    });

    acc = acc.concat(localEvents);
    return acc;
  }, []);

  let filterActions = {};
  if (payload.filterActions) {
    let filters = updateFilterOptions({
      filters: payload.filters,
      events,
    });
    filterActions['sources'] = payload.filterActions;
    filterActions['filters'] = filters;

    events = updateEvents(filters, events);
  } else {
    filterActions = buildFilterActions({
      sources: payload.sources,
      events,
    });
  }

  // Update the events colors
  events = setEventsColor(
    events,
    filterActions.sources,
    null,
    filterActions.filters,
  );

  yield put(
    actions.setFilterActions({
      key: payload.key,
      filterActions: filterActions.sources,
      filters: filterActions.filters,
    }),
  );

  // TODO: figure out how to handle errors
  yield put(actions.fetchCalendarEventsSuccess({ key: payload.key, events }));
}

/**
 * This saga is called via a poller to update calendar event data and uses
 * currently stored redux info instead of expecting updated payload values,
 * except for calendar key and timezone
 */
export function* refetchCalendarEventsSaga({ payload }) {
  const eventModalOpen = yield select(state =>
    state.calendar.getIn([payload.key, 'eventModalOpen']),
  );

  const dateModalOpen = yield select(state =>
    state.calendar.getIn([payload.key, 'dateModalOpen']),
  );

  const calendarView = yield select(state =>
    state.calendar.getIn([payload.key, 'mainCalendarView']),
  );

  // Do not run if either modal is open
  if (!eventModalOpen && !dateModalOpen) {
    // Grab existing data from state
    const cal = yield select(state => state.calendar.get(payload.key));

    // Timezone must be passed in
    const timezone = payload.timezone;

    // Call existing fetchCalendarEvents saga
    yield put(
      actions.fetchCalendarEvents({
        refetch: true,
        key: payload.key,
        date: cal.get('selectedDate'),
        sources: cal.get('sources'),
        filters: cal.get('filters'),
        filterActions: cal.get('filterActions'),
        calendarView,
        timezone,
      }),
    );
  }
}

// Fetch Locales Metadata Task
export function* fetchLocaleMetaTask() {
  const { timezones } = yield all({
    // locales: call(fetchLocales),
    timezones: call(fetchTimezones),
  });
  yield put(
    actions.fetchLocaleMetaSuccess({
      // locales: locales.data.locales,
      timezones: timezones.data.timezones,
    }),
  );
}

const fetchTimezones = () =>
  axios.get(`${bundle.apiLocation()}/meta/timezones`);

export function* watchCalendar() {
  yield takeEvery(types.FETCH_CALENDAR_CONFIGURATION, fetchCalendarConfigSaga);
  yield takeEvery(types.FETCH_CALENDAR_EVENTS, fetchCalendarEventsSaga);
  yield takeEvery(types.REFETCH_CALENDAR_EVENTS, refetchCalendarEventsSaga);
}
