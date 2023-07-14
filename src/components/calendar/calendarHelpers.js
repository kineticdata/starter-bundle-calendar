import { List, Map, Set } from 'immutable';
import md5 from 'md5';
import moment from 'moment';

const COLORS = [
  '#1094C4', //blue
  '#A8B7C7', //blue-gray
  '#095482', //blue-lake
  '#0C384F', //blue-slate
  '#0BA8E0', //blue-sky
  '#00D46A', //green-grass
  '#66E141', //green
  '#02D4B1', //green-teal
  '#FF991C', //orange
  '#A63096', //purple
  '#4B0082', //indigo
  '#BF3479', //red-purple
  '#FA3A37', //red
  '#FF4A5E', //red-rose
  '#FFCF4A', //sunflower
  '#FEE94E', //yellow
];

export const getColor = string =>
  string
    ? COLORS[parseInt(md5(string).slice(0, 6), 16) % COLORS.length]
    : COLORS[5];

export const getDetail = (event, key) =>
  typeof event.details.get(key) === 'object'
    ? event.details.get(key).value
    : event.details.get(key);

/**
 * Get a count of the events for a sources that match the filter option
 * and are not already filtered.
 *
 * @param {*} events
 * @param {*} sourceId
 * @param {*} key
 * @param {*} filter
 * @returns
 */
export const getCount = (events, sourceId, key, filter) =>
  events.filter(event => {
    const detail = getDetail(event, filter.get('value'));

    let isKeyMatch;
    if (Array.isArray(detail)) {
      isKeyMatch = filter.get(key).get('isChecked') && detail.includes(key);
    } else {
      isKeyMatch = key === detail;
    }

    return event.key === sourceId && !event.filter && isKeyMatch;
  }).length;

/**
 * This function is called when the calendar calls for new events.
 * The options may have changed between event sets.
 *
 * @param {*}
 * @param filterActions
 * @param events
 */
export const updateFilterOptions = ({ filters, events }) =>
  filters.map(filter => {
    // Get filter source id to use with getting events options.
    let sourceId = filter.get('sourceId');

    // Update the filters options
    let updatedFilter = filter
      .filter(property => !Map.isMap(property))
      .merge(getFilterOptions(events, sourceId, filter));

    // getFilterOptions strips off 'values' so add them back on.
    updatedFilter = updatedFilter.set('values', filter.get('values'));

    return updatedFilter;
  });

/**
 * Every unique value for the filter in the set of events will return an option.
 * Options are a map with the option name as the key with a checked property and
 * a value property.  The value property is the color of the option.
 *
 * To be added as an option the filter value must match the property key on an event's
 * details.
 *
 * @param {*} events
 * @param {*} key     // Event type key.
 * @param {*} filter
 * @returns
 */
export const getFilterOptions = (events, key, filter) => {
  // Get all event for a given source
  events = events.filter(event => event.key === key);

  // There should be an option for each event value for the given filter.
  const eventFilterOptionsSet = events.reduce((acc, event) => {
    // Some details are complex and need the value to be extracted.
    const detail = getDetail(event, filter.get('value'));

    if (Array.isArray(detail)) {
      // Make each element of detail array an option.
      detail.forEach(ele => {
        acc = acc.add(ele);
      });
      return acc;
    } else if (detail) {
      return acc.add(detail);
    }
    return acc;
  }, Set());

  // Get a set of filters from the previous view of the calendar.
  let existingOptionsSet = Set();
  filter
    .filter(property => Map.isMap(property))
    .forEach((_opt, optionKey) => {
      existingOptionsSet = existingOptionsSet.add(optionKey);
    });

  // Remove existing options so that new options can be initialized.
  const newOptionsSet = eventFilterOptionsSet.subtract(existingOptionsSet);

  // Return all options for events. If option is new initialize option. If option
  // existed in previous view return with state unchanged.
  let filterOptions = eventFilterOptionsSet.reduce((acc, name) => {
    if (newOptionsSet.has(name)) {
      acc = acc.set(
        name,
        Map({
          // during initialization isChecked is undefined
          isChecked: filter.toJS().isChecked === false ? false : true,
          // value is the color of the event when filter is open.
          value: filter.get('values').has(name)
            ? filter.get('values').get(name)
            : getColor(name),
        }),
      );
    } else if (existingOptionsSet.has(name)) {
      acc = acc.set(name, filter.get(name));
    }
    return acc;
  }, Map());

  return filterOptions;
};

export const buildFilterActions = ({ sources, events }) => {
  let filters = Map();
  sources = sources.reduce((acc, source, key) => {
    let localSource = Map({
      // Tracking of checkbox state
      isChecked: true,
      sourceOpen: false,
      displayDash: false,
      name: source.get('name'),
      color: source.get('color')
        ? source.get('color')
        : getColor(source.get('name')),
      count: events.filter(event => event.key === key).length,
      // TODO: if prop exists what do we do?  question open to Matt H
      defaultFilter: source.has('defaultFilter') ? false : true,
      filterIds: source.has('filterMapping')
        ? source.get('filterMapping').map(filter => filter.get('id'))
        : List(),
    });

    source.has('filterMapping') &&
      source.get('filterMapping').reduce((acc, filter) => {
        const filterId = filter.get('id');
        const localFilter = Map({
          value: filter.get('value'),
          sourceId: key, // Source Id is used to get the filter options
          isChecked: true,
          filterOpen: false,
          displayDash: false,
          name: filter.get('name'),
          color: 'blue',
          values: filter.get('values'),
        }).merge(
          filter.has('value') ? getFilterOptions(events, key, filter) : Map(),
        );

        filters = filters.set(filterId, localFilter);
        return acc.set(filterId, localFilter);
      }, Map());

    return acc.set(key, localSource);
  }, Map());

  filters = filters
    .filter(filter => filter.has('value'))
    .map(filter =>
      filter.merge(getFilterOptions(events, filter.get('sourceId'), filter)),
    );

  return { sources, filters };
};

/**
 * Hide or show events based on which filters are checked.
 *
 * @param {*} filters
 * @param {*} events
 * @returns
 */
export const updateEvents = (filters, events) => {
  // Build a Map of sourceId to Maps of options with arrays of checked values
  const checkedOptionsMap = filters.reduce((acc, filter) => {
    let checkedOptions = filter.reduce((acc, option, optionKey) => {
      if (Map.isMap(option) && option.get('isChecked')) {
        // Add checked option to List so that the event doesn't get filtered.
        acc = acc.push(optionKey);
      }
      return acc;
    }, List());

    acc = acc.setIn(
      [filter.get('sourceId'), filter.get('value')],
      checkedOptions,
    );
    return acc;
  }, Map());

  // Using the list of checked options determine if event should be filtered
  return events.map(event => {
    // Will be undefined if the configuration has no filterMapping defined.
    const checkedOptions = checkedOptionsMap.get(event.key);

    const isFiltered =
      checkedOptions &&
      checkedOptions.every((options, detailName) => {
        const detail = getDetail(event, detailName);
        if (Array.isArray(detail)) {
          return detail.some(ele => options.find(option => option === ele));
        } else {
          return options.find(option => option === detail);
        }
      });

    return isFiltered || checkedOptionsMap.isEmpty()
      ? { ...event, filter: false }
      : { ...event, filter: true };
  });
};

export const getDateRange = (fieldObj, date, calendarView) => {
  date = date ? moment(date).format() : moment().format();

  let dates;
  if (calendarView === 'month' || calendarView === undefined) {
    dates = getMonthRange(date);
  } else if (calendarView === 'week' || calendarView === 'agenda') {
    dates = getWeekRange(date);
  } else {
    dates = [moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD')];
  }

  return {
    [getPropertyName(fieldObj)]: `(${dates
      .map(date => `"${date}"`)
      .join(',')})`,
  };
};

const getWeekRange = date => {
  const mDate = moment(date, 'YYYY-MM-DD');
  mDate.subtract(mDate.day(), 'days');

  const dates = Array(7)
    .fill(null)
    .map((v, index) => {
      const addDays = index === 0 ? 0 : 1;
      return mDate.add(addDays, 'days').format('YYYY-MM-DD');
    });
  return dates;
};

const getMonthRange = date => {
  const mDate = moment(date, 'YYYY-MM');
  const daysCount = mDate.daysInMonth();

  // mDate is mutated below so get month here
  const month = mDate.format('YYYY-MM');
  const dates = Array(daysCount)
    .fill(null)
    .map((v, index) => {
      const addDays = index === 0 ? 0 : 1;
      return mDate.add(addDays, 'days').format('YYYY-MM-DD');
    });
  dates.push(month);
  return dates;
};

export const getStartDate = (fieldObj, date) => {
  return {
    [getPropertyName(fieldObj)]: moment(date)
      .startOf('month')
      .format(fieldObj.get('format')),
  };
};

export const getEndDate = (fieldObj, date) => {
  return {
    [getPropertyName(fieldObj)]: moment(date)
      .endOf('month')
      .format(fieldObj.get('format')),
  };
};

const getPropertyName = (fieldObj, key) =>
  fieldObj.get('fieldName').trim().length > 0 ? fieldObj.get('fieldName') : key;

/**
 * Updates event filter prop based on the event type key and checked box state.
 *
 * @param {*} events
 * @param {*} sourceKey
 * @param {*} isChecked
 * @returns
 */
// This function has been isolated to support unit testing
export const updateEventsIsChecked = (events, checkboxSourceKey, isChecked) => {
  // The filter will be the opposite of the checkbox state
  return events.map(event => {
    if (event.key === checkboxSourceKey) {
      return { ...event, filter: !isChecked };
    } else {
      return event;
    }
  });
};

/**
 * Updates an event type its filters and each filters options isChecked prop
 * based the event type key and checkbox state.
 *
 * @param {*} filterActions
 * @param {*} checkboxSourceKey
 * @param {*} isChecked
 * @returns
 */
// This function has been isolated to support unit testing
export const updateSourceIsChecked = (
  filterActions,
  checkboxSourceKey,
  isChecked,
) => {
  let source = filterActions.get(checkboxSourceKey);
  // Updated isChecked for event type
  source = source.set('isChecked', isChecked);
  // Loop event type props looking for filters.
  const sourceTemp = source
    .filter(property => Map.isMap(property))
    .map(sourceFilter => {
      // Loop filters looking for options
      const sourceFilterTemp = sourceFilter
        .filter(property => Map.isMap(property))
        .map(option => {
          // Update isChecked for option
          return option.set('isChecked', isChecked);
        });
      // Update isChecked for filter
      sourceFilter = sourceFilter.set('isChecked', isChecked);
      // Safely combine updated filter
      return sourceFilter.merge(sourceFilterTemp);
    });
  // Safely combine updated event type
  source = source.merge(sourceTemp);
  return filterActions.set(checkboxSourceKey, source);
};

/**
 * This function returns true if any filter for the source has an isChecked
 * value of false. This means that at least one filter is not checked.
 *
 * @param {*} filters
 * @param {*} sourceId
 */
export const getCheckedFiltersState = (filters, sourceId) =>
  filters
    .filter(filter => filter.get('sourceId') === sourceId)
    .some(filter => !filter.get('isChecked'));

/**
 * Checks if some filters but not all are checked.  Returns true if any
 * filters are checked.
 *
 * @param {*} filters
 * @param {*} sourceId
 * @returns
 */
const isFiltersIsChecked = (filters, sourceId) => {
  filters = filters.filter(filter => filter.get('sourceId') === sourceId);

  return (
    filters.some(filter => filter.get('isChecked')) &&
    !filters.every(filter => filter.get('isChecked'))
  );
};

/**
 * Sets the filter's isChecked and displayDash state based on the
 * isChecked parameters and the state of the filters options.
 *
 * @param {*} filterActions
 * @param {*} sourceId
 * @param {*} filterId
 * @param {*} isChecked
 * @returns
 */
// This function has been isolated to support unit testing
export const updateFilterIsChecked = (
  filterActions,
  sourceId,
  filterId,
  isChecked,
  filters,
) => {
  filters = filters
    .setIn(
      [filterId],
      filters.get(filterId).map(filterOption => {
        if (Map.isMap(filterOption)) {
          filterOption = filterOption.set('isChecked', isChecked);
        }
        return filterOption;
      }),
    )
    .setIn([filterId, 'isChecked'], isChecked);

  // Update event type isChecked property.
  filterActions = filterActions.setIn(
    [sourceId, 'isChecked'],
    !getCheckedFiltersState(filters, sourceId),
  );

  // Update Dash display properties for filterActions.
  filterActions = filterActions.setIn(
    [sourceId, 'displayDash'],
    isFiltersIsChecked(filters, sourceId),
  );

  return { filterActions, filters };
};

/**
 * Add properties for adding color to the event based on the state of the filters.
 *
 * @param {'*'} events
 * @param {*} filterActions
 * @param {*} sourceId
 * @returns
 */
export const setEventsColor = (events, filterActions, sourceId, filters) =>
  events.map(event => {
    let color;
    const source = filterActions.get(event.key);
    const activeFilter = filters.get(source.get('activeFilter'));

    // If a filter is active (open) update its color.
    // Navigating between months will have an null sourceId.
    if (activeFilter && (event.key === sourceId || !sourceId)) {
      // The filer name will map to a field in the event
      const filterName = activeFilter.get('value');

      // Some details are complex and need the value to be extracted.
      const detail = getDetail(event, filterName);

      // When detail is an array use source color.
      color =
        detail && !Array.isArray(detail)
          ? activeFilter.get(detail).get('value')
          : source.get('color');

      event = {
        ...event,
        classNames: ['event-color'],
        bgColor: color,
      };
      // Don't update all events
    } else if (event.key === sourceId || !sourceId) {
      color = source.get('color');
      event = {
        ...event,
        classNames: ['event-color'],
        bgColor: color,
      };
    }
    return event;
  });
