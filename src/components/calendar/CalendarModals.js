import React, { useState } from 'react';
import { Modal, ModalBody } from 'reactstrap';
import { CoreForm, I18n, Moment } from '@kineticdata/react';
import { compose, withHandlers } from 'recompose';
import moment from 'moment';
import { getDetail } from './calendarHelpers';
import { actions as calendarActions } from '../../redux/modules/calendar';
import { connect } from 'react-redux';

const ErrorMessage = () => (
  <div>
    There was an error matching calendar configuration to new event form fields.
  </div>
);

const renderEventDetail = (key, detail, timezone) => {
  let displayValue;
  if (typeof detail === 'object') {
    switch (detail.type) {
      case 'date-time':
        displayValue = (
          <Moment
            timestamp={moment(detail.value).tz(timezone)}
            format={detail.format}
          />
        );
        break;
      case 'hidden':
        return null;
      case 'link':
        displayValue = (
          <a
            href={detail.value}
            target="_blank"
            rel="noopener noreferrer"
            area-label={detail.displayText ? detail.displayText : detail.value}
          >
            {detail.displayText ? detail.displayText : detail.value}
          </a>
        );
        !detail.displayText &&
          console.info(
            `The detail ${key} did not provide display text property, using the detail value for link display.`,
          );
        break;
      default:
        console.warn(
          'A valid type was not provided in the calendar detail mapping',
        );
        displayValue = '';
    }
  } else {
    displayValue = detail;
  }
  return (
    <div className="evt-field" key={key}>
      <div className="evt-field--name">
        <b>{key}: </b>
        {displayValue}
      </div>
    </div>
  );
};

export const DateModal = props => {
  const {
    dateModalOpen,
    toggle,
    timezone,
    components,
    dateInfo,
    newDateForm,
    calendarKey,
  } = props;
  const BodyRender = components && components.BodyRender;
  const normalizedDateTime =
    timezone === false
      ? moment(dateInfo.date).toISOString()
      : moment(dateInfo.date)
          .tz(timezone)
          .toISOString();

  return (
    <Modal isOpen={dateModalOpen} toggle={toggle} size="lg">
      <div className="modal-header">
        <h4 className="modal-title">
          <button type="button" className="btn btn-link" onClick={toggle}>
            <I18n>Cancel</I18n>
          </button>
          <span>
            <I18n>Create Event</I18n>
          </span>
        </h4>
      </div>
      <ModalBody>
        <div className="p-4">
          {BodyRender ? (
            <BodyRender />
          ) : (
            <EventCoreForm
              newDateForm={newDateForm}
              calendarKey={calendarKey}
              normalizedDateTime={normalizedDateTime}
              toggle={toggle}
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

const getSubmissionId = (event, eventForm) => {
  try {
    return getDetail(event, eventForm.idKey);
  } catch (e) {
    console.error('error getting submission key');
  }
};

const EventCoreFormComponent = ({
  submissionId,
  handleUpdated,
  eventReviewMode,
  newDateForm,
  normalizedDateTime,
}) => {
  // Add start date/time to values if exist
  const fieldMapping = newDateForm && newDateForm.fieldMapping;
  const values = {
    ...(fieldMapping &&
      fieldMapping.startDateTime && {
        [newDateForm.fieldMapping.startDateTime]: normalizedDateTime,
      }),
    ...(fieldMapping &&
      fieldMapping.startDate && {
        [newDateForm.fieldMapping.startDate]: moment(normalizedDateTime).format(
          'YYYY-MM-DD',
        ),
      }),
    ...(fieldMapping &&
      fieldMapping.startTime && {
        [newDateForm.fieldMapping.startTime]: moment(normalizedDateTime).format(
          'HH:mm:ss',
        ),
      }),
  };

  return submissionId ? (
    <CoreForm
      submission={submissionId}
      review={eventReviewMode}
      updated={handleUpdated}
      components={{
        Unexpected: ErrorMessage,
      }}
    />
  ) : (
    <CoreForm
      kapp={newDateForm.kappSlug ? newDateForm.kappSlug : 'datastore'}
      form={newDateForm.formSlug}
      values={values}
      created={handleUpdated}
      components={{
        Unexpected: ErrorMessage,
      }}
    />
  );
};

const EventCoreForm = compose(
  connect(
    (state, props) => {
      const { calendarKey } = props;
      const calendar = state.calendar.get(calendarKey)
        ? state.calendar.get(calendarKey)
        : state.calendar.get('default');

      return {
        timezone: props.timezone,
        date: props.normalizedDateTime,
        calendarView: calendar.get('mainCalendarView'),
        filters: calendar.get('filters'),
        sources: calendar.get('sources'),
        filterActions: calendar.get('filterActions'),
      };
    },
    { fetchEvents: calendarActions.fetchCalendarEvents },
  ),
  withHandlers({
    handleUpdated: props => response => {
      const {
        fetchEvents,
        toggle,
        calendarKey,
        timezone,
        date,
        filters,
        sources,
        filterActions,
      } = props;

      fetchEvents({
        key: calendarKey,
        date,
        filters,
        sources,
        timezone,
        filterActions,
        calendarView: props.mainCalendarView,
      });
      toggle(null);
    },
  }),
)(EventCoreFormComponent);

export const EventModal = props => {
  const {
    eventModalOpen,
    toggle,
    title,
    event,
    additionalHeadElements,
    timezone,
    components,
    details,
    eventForm,
    calendarKey,
  } = props;
  const BodyRender = components && components.BodyRender;
  const submissionId = eventForm && getSubmissionId(event, eventForm);
  const [eventReviewMode, setEventReviewMode] = useState(true);

  return (
    <Modal isOpen={eventModalOpen} toggle={toggle} size="lg">
      <div className="modal-header">
        <h4 className="modal-title">
          <button type="button" className="btn btn-link" onClick={toggle}>
            <I18n>Cancel</I18n>
          </button>
          <span>
            <I18n>{title ? title : event.title}</I18n>
          </span>
          {eventForm && eventReviewMode && (
            <button
              type="button"
              className="btn btn-link"
              onClick={() => setEventReviewMode(false)}
            >
              <I18n>Edit Event</I18n>
            </button>
          )}
        </h4>
        {additionalHeadElements ? (
          additionalHeadElements()
        ) : (
          <div className="p-3">
            <div>
              <span>
                <Moment
                  timestamp={
                    timezone === false
                      ? moment(event.start)
                      : moment(event.start).tz(timezone)
                  }
                  format={'LLL'}
                />{' '}
                -{' '}
                <Moment
                  timestamp={
                    timezone === false
                      ? moment(event.end)
                      : moment(event.end).tz(timezone)
                  }
                  format={'LLL'}
                />
              </span>
            </div>
            <div>{event.type}</div>
          </div>
        )}
      </div>
      <ModalBody>
        {BodyRender ? (
          <BodyRender />
        ) : submissionId ? (
          <EventCoreForm
            eventReviewMode={eventReviewMode}
            submissionId={submissionId}
            calendarKey={calendarKey}
            toggle={toggle}
          />
        ) : details ? (
          details(renderEventDetail)
        ) : (
          'Body display'
        )}
      </ModalBody>
    </Modal>
  );
};
