import React from 'react';
import { Map } from 'immutable';
import 'react-dates/initialize';
import { DayPickerSingleDateController } from 'react-dates';
import classNames from 'classnames';
import { generateKey } from '@kineticdata/react';
import moment from 'moment';
import { getCount } from './calendarHelpers';

export const MiniCalendar = props => (
  <DayPickerSingleDateController
    key={props.datePickerKey}
    date={props.selectedDate}
    onDateChange={selectedDate => {
      props.handleMiniDateChange(selectedDate);
    }}
    numberOfMonths={1}
    daySize={30}
    hideKeyboardShortcutsPanel={true}
    noBorder={true}
    focused={true}
  />
);

export const SourceList = props => {
  return (
    <div className="calendar--filter">
      {props.filterActions.size > 0 &&
        props.filterActions
          .sortBy(filter => filter.get('name'))
          .map((source, sourceId) => (
            <div key={sourceId}>
              <div className="checkbox__filter">
                <SourceCheckBox
                  {...props}
                  source={source}
                  sourceId={sourceId}
                />
                <div className="filter__control">
                  <small>
                    {
                      props.events.filter(
                        event => event.key === sourceId && !event.filter,
                      ).length
                    }
                  </small>
                  <SourceOpenButton
                    handleSourceOpen={props.handleSourceOpen}
                    sourceOpen={source.get('sourceOpen')}
                    sourceId={sourceId}
                  />
                </div>
              </div>
              {source.get('sourceOpen') && (
                <FilterList
                  filters={props.filters}
                  sourceId={sourceId}
                  handleFilterCheckboxChange={props.handleFilterCheckboxChange}
                  handleFilterOpen={props.handleFilterOpen}
                  handleOptionChange={props.handleOptionChange}
                  events={props.events}
                />
              )}
            </div>
          ))
          .toList()}
    </div>
  );
};

export const FilterList = ({
  filters,
  sourceId,
  handleFilterCheckboxChange,
  handleFilterOpen,
  handleOptionChange,
  events,
}) => {
  return filters
    .filter(filter => filter.get('sourceId') === sourceId)
    .sortBy(filter => filter.get('name'))
    .map((filter, filterKey) => (
      <div className="calendar-filter" key={filterKey}>
        <div className="checkbox__filter">
          <FilterCheckBox
            filter={filter}
            filterId={filterKey}
            sourceId={sourceId}
            handleFilterCheckboxChange={handleFilterCheckboxChange}
          />
          <FilterOpenButton
            handleFilterOpen={handleFilterOpen}
            sourceId={sourceId}
            filterId={filterKey}
            filterOpen={filter.get('filterOpen')}
          />
        </div>
        {filter.get('filterOpen') && (
          <OptionList
            key={`${filterKey}-optionList`}
            filter={filter}
            handleOptionChange={handleOptionChange}
            filterId={filterKey}
            sourceId={sourceId}
            events={events}
          />
        )}
      </div>
    ))
    .toList();
};

export const OptionList = ({
  filter,
  filterId,
  sourceId,
  events,
  handleOptionChange,
}) => {
  return filter
    .filter((option, optionKey) => Map.isMap(option) && optionKey !== 'values')
    .sortBy((v, key) => key)
    .map((value, key) => (
      <div className="calendar-options" key={key}>
        <div className="checkbox__filter">
          <OptionCheckBox
            filterId={filterId}
            sourceId={sourceId}
            value={value}
            name={key}
            filter={filter}
            handleOptionChange={handleOptionChange}
          />
          <small>{getCount(events, sourceId, key, filter)}</small>
        </div>
      </div>
    ))
    .toList();
};

export const SourceCheckBox = ({
  sourceId,
  handleSourceCheckboxChange,
  source,
  filterActions,
}) => {
  const sourceAction = filterActions.get(sourceId);

  return (
    <span
      className={classNames('filter-checkbox', 'checkbox-color', {
        'filter-checkbox--dash': sourceAction.get('displayDash'),
      })}
      style={{ '--color-var': sourceAction.get('color') }}
    >
      <input
        id={sourceId}
        value={sourceId}
        type="checkbox"
        onChange={handleSourceCheckboxChange}
        checked={sourceAction.get('isChecked')}
      />
      <label htmlFor={sourceId}>
        <span className="ellipsis">{source.get('name')}</span>
      </label>
    </span>
  );
};

export const FilterCheckBox = ({
  sourceId,
  handleFilterCheckboxChange,
  filter,
  filterId,
}) => {
  return (
    <span
      className={classNames('filter-checkbox', 'checkbox-color', {
        'filter-checkbox--dash': filter.get('displayDash'),
      })}
      style={{ '--color-var': 'black' }}
    >
      <input
        id={filterId}
        value={filterId}
        type="checkbox"
        data-event-type-id={sourceId}
        onChange={handleFilterCheckboxChange}
        checked={filter.get('isChecked')}
      />
      <label htmlFor={filterId}>
        <span className="ellipsis">{filter.get('name')}</span>
      </label>
    </span>
  );
};

export const OptionCheckBox = ({
  sourceId,
  handleOptionChange,
  filterId,
  name,
  filter,
}) => {
  const optionAction = filter.get(name);
  const key = generateKey();
  return (
    <span
      className={classNames('filter-checkbox', 'checkbox-color')}
      style={{ '--color-var': optionAction.get('value') }}
    >
      <input
        id={key}
        value={name}
        type="checkbox"
        data-event-type-id={sourceId}
        data-filter-id={filterId}
        onChange={handleOptionChange}
        checked={optionAction.get('isChecked')}
      />
      <label htmlFor={key}>
        <span className="ellipsis">{name ? name : '__blank__'}</span>
      </label>
    </span>
  );
};

export const SourceOpenButton = ({
  sourceId,
  handleSourceOpen,
  sourceOpen,
}) => (
  <button
    className="btn-no-style"
    value={sourceOpen}
    data-event-type-id={sourceId}
    onClick={handleSourceOpen}
  >
    <i
      className={`fa fa-chevron-${sourceOpen ? 'down' : 'up'}`}
      aria-hidden="true"
    />
  </button>
);

export const FilterOpenButton = props => (
  <button
    className="btn-no-style"
    value={props.filterOpen}
    data-event-type-id={props.sourceId}
    data-filter-id={props.filterId}
    onClick={props.handleFilterOpen}
  >
    <i
      className={`fa fa-chevron-${props.filterOpen ? 'down' : 'up'}`}
      aria-hidden="true"
    />
  </button>
);

export const Timezones = props => {
  return (
    <div className="form-group">
      <label htmlFor="timezone">Timezone</label>
      <select
        type="text"
        id="timezone"
        name="timezone"
        className="form-control"
        onChange={props.handleTimezoneChange}
        value={props.timezone}
      >
        <option value="">None Selected</option>
        {props.timezones
          // there are some timezones returned that aren't supported by moment
          .filter(timezone => moment.tz.zone(timezone.get('id')))
          // sort by offset
          .sortBy(timezone => moment.tz(timezone.get('id')).utcOffset())
          .map(timezone => (
            <option value={timezone.get('id')} key={timezone.get('id')}>
              {moment.tz(timezone.get('id')).format('Z')} {timezone.get('name')}{' '}
              ({timezone.get('id')})
            </option>
          ))}
      </select>
    </div>
  );
};
