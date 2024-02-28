import React, { useEffect, useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { CodeBlock } from 'react-code-blocks';

import { useForm, updateConfig } from '../hooks';
import { useParams, Link } from 'react-router-dom';
import { CALENDAR_KAPP_SLUG } from '../constants';
import { EventTypesText, NewDateForm, EventForm } from './calendar/HelpText';

export const CalendarSettings = () => {
  const kappSlug = CALENDAR_KAPP_SLUG;
  const { formSlug } = useParams();

  // Fetch Form
  const form = useForm(kappSlug, formSlug);

  // Setup State
  const [configJSON, setConfigJSON] = useState();
  const [origConfigJSON, setOrigConfigJSON] = useState();

  // useEffect will set code equal to the form when it loads or changes
  useEffect(() => {
    if (form) {
      // Calendar Config is a single attribute so we can use the intial index
      setConfigJSON(JSON.stringify(JSON.parse(form.attributesMap['Calendar Config'][0]), null, 2));
      setOrigConfigJSON(JSON.stringify(JSON.parse(form.attributesMap['Calendar Config'][0]), null, 2));
    }
  }, [form]);

  const onSave = () => {
    const calendarConfig = JSON.stringify(JSON.parse(configJSON));
    updateConfig(kappSlug, formSlug, calendarConfig);
  };

  return (
    <div className="row p-4">
      <div className="col-12">
        <h1>
          Calendar Settings for {form && <Link to={`/calendar/${form.slug}`}>{form.name}</Link>}
        </h1>
      </div>
      <div className="col-4">
        <p>
          To change calendar settings, edit the JSON configuration below and hit
          save.
        </p>
        <CodeEditor
          value={configJSON}
          language="json"
          onChange={evn => setConfigJSON(evn.target.value)}
          padding={15}
          data-color-mode="dark"
          style={{
            fontSize: 12,
            fontFamily:
              'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          }}
        />
        <br />
        <button
          className={`btn btn-primary pull-right `}
          disabled={configJSON === origConfigJSON}
          onClick={onSave}
        >
          Save
        </button>
      </div>
      <div className="col-8">
        <h2>Calendar Configuration Properties</h2>
        <ul>
          <li>
            <b>defaultView:</b> The default view of the calendar ("month", "week", "day" )
          </li>
          <li>
            <b>eventForm:</b> (Optional) defines a submission to be rendered
            when an event in the main calendar is selected.{' '}
            <i>A submission id is required.</i>
            <EventForm/>
          </li>
          <li>
            <b>newDateForm:</b> (Optional) defines a form to be rendered when an
            open spot in main calendar is selected
            <NewDateForm />
          </li>
          <li>
            <b>eventTypes:</b> An array of Event Types that represented as JSON
            objects
            <EventTypesText />
          </li>
        </ul>
      </div>
    </div>
  );
};
