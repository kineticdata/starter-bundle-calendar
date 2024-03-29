import React from 'react';
import { CodeBlock } from 'react-code-blocks';

export const EventTypesText = () => {
  const text = `
  "eventTypes": {
    "name": "Change Requests", //Name of the Event Type
    "color": "#F36C23", // (Optional) This defines the color of the calendar. Use hex color code.
    "coreMapping": {
        "title": ["Summary"], // An array of bridge model attributes used to build the title displayed on the calendar"
        "start": "Scheduled Start Date", // The bridge model attribute used to determine the start date of the event
        "end": "Scheduled End Date" // The bridge model attribute used to determine the end date of the event
    },
    "filterMapping": [ // An array of filter options to be applied to the Event Type.
      {
        "name": "Impact", // Descriptive name of the filter
        "value": "Impact", // Value of the filter, corresponds to value in "detailMapping"
        "values": { // Mapping of values to colors. Use Hex Color. Empy object defers color selection to randomly generated colors.
          "4-Minor/Localized": "#ffb73b",
          "3-Moderate/Limited": "#7f5b1d"
        }
      },
      {
        "name": "Change Location", // Descriptive name of the filter
        "value": "Change Location", // Value of the filter, corresponds to value in "detailMapping"
        "values": {} // Mapping of values to colors. Use Hex Color. Empy object defers color selection to randomly generated colors.
      }
    ],
    "detailMapping": { // Drives the label displayed in the event modal, mapped to the corresponding bridge model attribute.
        "Id": "Id", // Mapping can be a string which matches the cooresponding bridge model attribute
        "Impact": "Impact",
        "Change Location": "Change Location",
        "Start Date": { // Or an object which represents a date time
            "attributeName": "Scheduled Start Date",
            "type": "date-time",
            "format": "1111"
        },
        "End Date": { // Or an object which represents a date time
            "attributeName": "Scheduled End Date",
            "type": "date-time",
            "format": "1111"
        },
        "External Site": {
            "attributeName": "Link to Change",
            "type": "link",
            "displayText": "Click here to navigate to the change"
        }
    },
    "source": {
        "bridgedResourceName": "Changes", //Name of the Bridged Resource to use for this source
        "parameters": { 
            //Maps the Start/End Date to the fields on the form that are leveraged by the bridged resource
            "Start Date": {
              "fieldName": "Start Date"
            },
            "End Date": {
              "fieldName": "End Date" 
            }
        }
    }
}`;
  return (
    <code>
      <CodeBlock text={text} language="json" />
    </code>
  );
};

export const NewDateForm = () => {
  const text = `
"newDateForm": {
    "kappSlug": "calendar",
    "formSlug": "new-change",
    "fieldMapping": {
        "startDateTime": "Start Date Time"
    }
}`;
  return (
    <code>
      <CodeBlock text={text} language="json" />
    </code>
  );
};

export const EventForm = () => {
    const text = `
    "eventForm": {
        "submissionIdKey": "Id",  // If present, we load coreForm with an ID
        "kappSlug": "calendar",   // Only necessary if no submissionIdKey provided
        "fromSlug": "new-change", // Only necessary if no submissionIdKey provided
        "fieldMapping": {	      // Only necessary if no submissionIdKey provided
          "Form Field 1 Name": "Detail Mapping 1 Id", 
          "Change ID": "Change_Id"
        },
      }`;
    return (
      <code>
        <CodeBlock text={text} language="json" />
      </code>
    );
  };



