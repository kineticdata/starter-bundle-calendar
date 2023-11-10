import React, { Component, createRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export class MainCalendar extends Component {
  constructor(props) {
    super(props);
    this.calendarRef = createRef();
  }

  handlerDateChange = () => {
    const date = this.calendarRef.current.getApi().getDate();

    // Update redux with the selected view type
    const selectedView = this.calendarRef.current.getApi().view.type;
    const viewObject = {
      dayGridMonth: 'month',
      timeGridWeek: 'week',
      timeGridDay: 'day',
      listWeek: 'agenda',
    };
    this.props.handleMainViewChange(viewObject[selectedView]);
    this.props.handleMainNavigateChange(date);
  };

  handleDateClick = dateInfo => {
    // Take date from fullcalendar and reformat to new event
    dateInfo = {
      allDay: dateInfo.allDay,
      date: dateInfo.dateStr,
    };
    this.props.handleMainDateSelect(dateInfo);
  };

  handleEventClick = ({ event }) => {
    // Take event from fullcalendar and reformat to passed in event
    event = {
      allDay: event.allDay,
      details: event.extendedProps.details,
      end: event.end,
      filter: event.extendedProps.filter,
      key: event.extendedProps.key,
      start: event.start,
      title: event.title,
      type: event.extendedProps.type,
    };
    this.props.handleMainEventSelect(event);
  };

  handleEventsRefresh = () => {
    const date = this.calendarRef.current.getApi().getDate();
    this.props.fetchCalendarEvents({
      filters: this.props.filters,
      // TODO: Remove when no longer needed
      filterActions: this.props.filterActions,
      sources: this.props.sources,
      key: this.props.calendarKey,
      date: date,
      timezone: this.props.timezone,
    });
  };
  
  componentDidUpdate(prevProps) {
    if (!this.props.selectedDate.isSame(prevProps.selectedDate)) {
      this.calendarRef.current
        .getApi()
        .gotoDate(this.props.selectedDate.format());
    }
    if (this.props.timezone !== prevProps.timezone) {
      this.calendarRef.current
        .getApi()
        .setOption('timeZone', this.props.timezone);
    }
    if (this.props.mainCalendarView !== prevProps.mainCalendarView) {
      const viewObject = {
        month: 'dayGridMonth',
        week: 'timeGridWeek',
        day: 'timeGridDay',
        agenda: 'listWeek',
      };
      this.calendarRef.current
      .getApi()
      .changeView(viewObject[this.props.mainCalendarView]);
    }
  }

  render() {
    return (
      <FullCalendar
        events={this.props.events.filter(event => !event.filter)}
        ref={this.calendarRef}
        height={'parent'}
        contentHeight={'auto'}
        eventLimit={this.props.maxEventLimit ? this.props.maxEventLimit : 3}
        defaultView="dayGridMonth"
        // rerenderDelay will delay 1 sec in order for all rerenders of the calendar to finish
        // this is used because of styling changes between rerenders and should be removed if those are fixed
        rerenderDelay={1000}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          momentTimezonePlugin,
          listPlugin,
          interactionPlugin,
        ]}
        header={{
          left: 'prev,today,next',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          timeGridDay: 'Day',
          dayGridMonth: 'Month',
          timeGridWeek: 'Week',
          listWeek: 'List',
          today: 'Today',
          prev: 'Previous',
          next: 'Next',
        }}
        navLinks={true}
        datesRender={() => {
          if (this.calendarRef.current) {
            this.handlerDateChange();
          }
        }}
        eventClick={this.handleEventClick}
        dateClick={this.props.newDateForm && this.handleDateClick}
        fixedWeekCount={false}
        showNonCurrentDates={false}
        eventLimitClick={
          this.props.eventLimitClick
            ? typeof this.props.eventLimitClick === 'function'
              ? () =>
                  console.warn(
                    'eventLimitClick as a function has not been implemented.',
                  )
              : this.props.eventLimitClick
            : 'popover'
        }
        eventMouseEnter={
          typeof this.props.eventMouseEnter === 'function'
            ? mouseObj => {
                this.props.eventMouseEnter({
                  el: mouseObj.el,
                  calendarEvent: {
                    title: mouseObj.event.title,
                  },
                });
              }
            : null
        }
        eventMouseLeave={
          typeof this.props.eventMouseLeave === 'function'
            ? mouseObj => {
                this.props.eventMouseLeave({
                  el: mouseObj.el,
                  calendarEvent: {
                    title: mouseObj.event.title,
                  },
                });
              }
            : null
        }
        // This may not be forwards compatible with fullcalendar v5
        eventRender={eventObj => {
          // Each event is given a color, the color can be set by the getColor
          // function or user defined.
          const backgroundColor = eventObj.event.extendedProps.bgColor;
          // For ultra flexibility pass the color through a css var.
          eventObj.el.setAttribute('style', `--color-var:${backgroundColor};`);

          return eventObj.el;
        }}
      />
    );
  }
}
