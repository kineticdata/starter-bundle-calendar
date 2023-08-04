import React, { Fragment } from 'react';
import { MainCalendar } from './MainCalendar';
import { SourceList, MiniCalendar, Timezones } from './CalendarElements';
import { DateModal, EventModal } from './CalendarModals';

export const CalendarWrapper = props => {
  const EventRender = props.components && props.components.EventRender;
  const DatesRender = props.components && props.components.DatesRender;

  return (
    <Fragment>
      {props.title &&
        props.title({
          ...props.calendarConfig,
          selectedDate: props.selectedDate,
          timezone: props.timezone,
        })}
      <div className="calendar-component column-container">
        <div className="calendar-panel calendar-panel--left">
          <MiniCalendar {...props} />
          {(props.timezoneDisplay === undefined || props.timezoneDisplay) && (
            <Timezones {...props} />
          )}
          <SourceList {...props} />
        </div>
        <div className="calendar-panel calendar-panel--right">
          <MainCalendar {...props} />
        </div>
      </div>
      {props.dateModalOpen &&
        (DatesRender ? (
          // User defined modal
          <DatesRender
            {...{
              toggle: () => {
                props.handleMainDateSelect(null);
              },
              dateModalOpen: props.dateModalOpen,
              dateInfo: props.mainCalendarDate,
              timezone: props.timezone,
              newDateForm:
                props.calendarConfig && props.calendarConfig.newDateForm,
              calendarKey: props.calendarKey,
              fetchEvents: props.fetchCalendarEvents,
              filters: props.filters,
              sources: props.sources,
              filterActions: props.filterActions,
            }}
          />
        ) : (
          // Default modal
          <DateModal
            toggle={() => {
              props.handleMainDateSelect(null);
            }}
            dateInfo={props.mainCalendarDate}
            timezone={props.timezone}
            dateModalOpen={props.dateModalOpen}
            newDateForm={
              props.calendarConfig && props.calendarConfig.newDateForm
            }
            calendarKey={props.calendarKey}
          />
        ))}
      {props.eventModalOpen &&
        (EventRender ? (
          // User defined modal
          <EventRender
            {...{
              toggle: () => {
                props.handleMainEventSelect(null);
              },
              eventModalOpen: props.eventModalOpen,
              event: props.mainCalendarEvent,
              eventForm:
                props.calendarConfig &&
                props.calendarConfig.eventForm &&
                Object.keys(props.calendarConfig.eventForm).length > 0,
              timezone: props.timezone,
              fetchEvents: props.fetchCalendarEvents,
              calendarKey: props.calendarKey,
              filters: props.filters,
              sources: props.sources,
              filterActions: props.filterActions,
            }}
          />
        ) : (
          // Default modal
          <EventModal
            toggle={() => {
              props.handleMainEventSelect(null);
            }}
            event={props.mainCalendarEvent}
            timezone={props.timezone}
            eventModalOpen={props.eventModalOpen}
            eventForm={
              props.calendarConfig &&
              props.calendarConfig.eventForm
            }
            calendarKey={props.calendarKey}
            details={renderEventDetail => {
              const details = props.mainCalendarEvent.details;
              return (
                <div className="text-break p-3">
                  {Object.keys(details.toJS()).map(key =>
                    renderEventDetail(key, details.get(key), props.timezone),
                  )}
                </div>
              );
            }}
          />
        ))}
    </Fragment>
  );
};
