import { generateKey } from '@kineticdata/react';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { List, Map, fromJS } from 'immutable';
import { actions, refetchCalendarEvents } from '../../redux/modules/calendar';
import moment from 'moment';
import {
  updateEvents,
  updateEventsIsChecked,
  updateSourceIsChecked,
  updateFilterIsChecked,
  getCheckedFiltersState,
  setEventsColor,
} from './calendarHelpers';
import { CalendarWrapper } from './CalendarWrapper';
import { connect } from 'react-redux';
export { refetchCalendarEvents };

export const handleMainDateSelect = props => args => {
  console.log(args);
  let modalOpen;
  if (args == null) {
    modalOpen = false;
  } else {
    modalOpen = true;
  }
  props.setCalendarDateSelect({ key: props.calendarKey, args, modalOpen });
};

export const handleMainEventSelect = props => args => {
  let modalOpen;
  if (args === null) {
    modalOpen = false;
  } else {
    modalOpen = true;
  }
  props.setCalendarEventSelect({ key: props.calendarKey, args, modalOpen });
};

export const handleMiniDateChange = props => args => {
  if (!props.selectedDate.isSame(args, 'month')) {
    props.fetchCalendarEvents({
      filters: props.filters,
      // TODO: Remove when no longer needed
      filterActions: props.filterActions,
      sources: props.sources,
      key: props.calendarKey,
      date: args,
      timezone: props.timezone,
      calendarView: props.mainCalendarView,
    });
  }
  props.setMiniDateChange({ key: props.calendarKey, miniDate: args });
};

export const handleMainViewChange = props => view => {
  props.setMainViewChange({ key: props.calendarKey, view });
};

export const handleMainNavigateChange = props => date => {
  props.fetchCalendarEvents({
    filters: props.filters,
    // TODO: Remove when no longer needed
    filterActions: props.filterActions,
    sources: props.sources,
    key: props.calendarKey,
    date,
    timezone: props.timezone,
    calendarView: props.mainCalendarView,
  });
  props.setMainNavigateChange({ key: props.calendarKey, date });
};

export const handleSourceOpen = props => event => {
  // the value of the button is a boolean that controls if filters are active.
  const filterActions = props.filterActions.setIn(
    [event.currentTarget.getAttribute('data-event-type-id'), 'sourceOpen'],
    !(event.currentTarget.value === 'true'),
  );
  props.updateFromFilter({
    key: props.calendarKey,
    events: props.events,
    filterActions,
  });
};

export const handleFilterOpen = props => event => {
  const sourceId = event.currentTarget.getAttribute('data-event-type-id');
  const filterId = event.currentTarget.getAttribute('data-filter-id');
  let filters = props.filters;

  // Close previously open filter
  const previousActiveFilter = props.filterActions
    .get(sourceId)
    .get('activeFilter');

  // The value property of the button is a boolean that controls if filters are active.
  let filterActions = props.filterActions.setIn(
    [sourceId, 'activeFilter'],
    previousActiveFilter === filterId ? null : filterId,
  );

  // The value property of the button is a boolean that controls if filter are open.
  filters = filters.setIn(
    [filterId, 'filterOpen'],
    !(event.currentTarget.value === 'true'),
  );

  // Close the previously open filter.
  if (previousActiveFilter && previousActiveFilter !== filterId) {
    filters = filters.setIn(
      [previousActiveFilter, 'filterOpen'],
      event.currentTarget.value === 'true',
    );
  }

  const events = setEventsColor(props.events, filterActions, sourceId, filters);

  props.updateFromFilter({
    key: props.calendarKey,
    filters,
    events,
    filterActions,
  });
};

/**
 * Fired when UI checkbox for source is interacted with.
 *
 * @param {*} props
 * @returns
 */
export const handleSourceCheckboxChange = props => e => {
  const {
    events: propsEvents,
    filterActions: propsFilterActions,
    updateFromFilter,
    calendarKey,
    filters: propsFilters,
  } = props;

  const isChecked = e.target.checked;
  const sourceId = e.target.value;

  // Update checked status of events by event key
  const events = updateEventsIsChecked(propsEvents, sourceId, isChecked);

  // Update filter actions filters
  const filterActions = updateSourceIsChecked(
    propsFilterActions,
    sourceId,
    isChecked,
  );

  // Update filter and options checked status
  const filters = propsFilters.map(filter => {
    if (filter.get('sourceId') === sourceId) {
      filter = filter.set('isChecked', isChecked);
      // TODO: Remove when options have their own redux state
      filter.forEach((option, optionKey) => {
        if (Map.isMap(option) && optionKey !== 'values') {
          filter = filter.setIn([optionKey, 'isChecked'], isChecked);
        }
      });
    }
    return filter;
  });

  updateFromFilter({ key: calendarKey, events, filters, filterActions });
};

export const handleFilterCheckboxChange = props => e => {
  const sourceId = e.target.getAttribute('data-event-type-id');
  const filterId = e.target.value;

  // Update the isChecked property. The target value is used to "know"
  // which filter and filter options to update.
  let { filterActions, filters } = updateFilterIsChecked(
    props.filterActions,
    sourceId,
    filterId,
    e.target.checked,
    props.filters,
  );

  // update filtered events
  const events = updateEvents(filters, props.events);
  props.updateFromFilter({
    key: props.calendarKey,
    events: events,
    filters,
    filterActions,
  });
};

export const handleOptionChange = props => e => {
  const sourceId = e.target.getAttribute('data-event-type-id');
  const filterId = e.target.getAttribute('data-filter-id');
  const value = e.target.value;
  const activeFilter = props.filterActions.get(sourceId).get('activeFilter');
  const options = props.filters
    .get(activeFilter)
    .filter(option => Map.isMap(option));

  // Change selected option checked state
  let filters = props.filters.setIn(
    [filterId, value, 'isChecked'],
    e.target.checked,
  );

  // Change the state of the filter checkbox if > 1 option is selected
  const checkedOptions = options.reduce((acc, option, key) => {
    return (option.get('isChecked') && key !== value) ||
      (key === value && e.target.checked)
      ? acc.push(key)
      : acc;
  }, List());
  filters = filters
    .setIn([filterId, 'isChecked'], options.size === checkedOptions.size)
    .setIn(
      [filterId, 'displayDash'],
      options.size !== checkedOptions.size && checkedOptions.size > 0,
    );

  // Change the state of the event type checkbox if > 1 filter is selected
  const checkedFiltersState = getCheckedFiltersState(filters, sourceId);

  let filterActions = props.filterActions
    .setIn([sourceId, 'isChecked'], !checkedFiltersState)
    .setIn([sourceId, 'displayDash'], checkedFiltersState);

  // Get events with new filtered.
  const events = updateEvents(filters, props.events);

  props.updateFromFilter({
    key: props.calendarKey,
    events,
    filters,
    filterActions,
  });
};

export const handleTimezoneChange = props => event => {
  props.setTimezone(event.target.value);
};

const mapStateToProps = (state, props) => {
  const calendar = state.calendar.get(props.calendarKey)
    ? state.calendar.get(props.calendarKey)
    : state.calendar.get('default');
  return {
    selectedDate: calendar.selectedDate,
    mainCalendarDate: calendar.mainCalendarDate,
    mainCalendarEvent: calendar.mainCalendarEvent,
    mainCalendarView: calendar.mainCalendarView,
    miniDateActive: calendar.miniDateActive,
    datePickerKey: calendar.datePickerKey,
    dateModalOpen: calendar.dateModalOpen,
    eventModalOpen: calendar.eventModalOpen,
    events: calendar.events,
    sources: calendar.sources,
    filterActions: calendar.filterActions,
    filters: calendar.filters,
    calendarConfig: calendar.calendarConfig,
    timezones: fromJS(state.calendar.get('timezones')),
    newDateForm:
      calendar.calendarConfig &&
      calendar.calendarConfig.newDateForm &&
      Object.keys(calendar.calendarConfig.newDateForm).length > 0,
  };
};

const mapDispatchToProps = {
  fetchConfig: actions.fetchCalendarConfig,
  setCalendarDateSelect: actions.setCalendarDateSelect,
  setCalendarEventSelect: actions.setCalendarEventSelect,
  setMainViewChange: actions.setCalendarViewChange,
  setMainNavigateChange: actions.setCalendarNavigateChange,
  setMiniDateChange: actions.setMiniDateChange,
  updateFromFilter: actions.updateFromFilter,
  setFilterOptions: actions.setFilterOptions,
  fetchCalendarEvents: actions.fetchCalendarEvents,
  setFilters: actions.setFilters,
};

export const Calendar = compose(
  // calendarKey is used as a prop in mapStateToProps so it must come before.
  withState('calendarKey', 'setCalendarKey', props =>
    props.calendarKey ? props.calendarKey : generateKey(),
  ),
  connect(mapStateToProps, mapDispatchToProps),
  withState('timezone', 'setTimezone', props =>
    props.timezone === false || props.timezone
      ? props.timezone
      : moment.tz.guess(),
  ),
  withHandlers({
    handleMainDateSelect,
    handleMainEventSelect,
    handleMiniDateChange,
    handleMainViewChange,
    handleMainNavigateChange,
    handleSourceCheckboxChange,
    handleFilterCheckboxChange,
    handleOptionChange,
    handleSourceOpen,
    handleFilterOpen,
    handleTimezoneChange,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchConfig({
        kappSlug: this.props.kappSlug,
        formSlug: this.props.formSlug,
        key: this.props.calendarKey,
        timezone: this.props.timezone,
      });
    },
  }),
)(CalendarWrapper);
