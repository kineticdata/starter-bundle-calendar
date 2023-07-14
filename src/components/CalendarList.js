import React from 'react';
import { Link } from 'react-router-dom';
import { FormTable } from '@kineticdata/react';
import * as TableComponents from './Layouts';
import { CALENDAR_KAPP_SLUG } from '../constants';

// structure for each cell in the name column
export const NameCell = ({ tableOptions: { kappSlug }, row }) => (
  <td>
    <Link to={`/calendar/${row.get('slug')}`}>{row.get('name')}</Link>
    <br />
    <small>{row.get('slug')}</small>
  </td>
);

// structure for each cell in the actions column
export const ActionsCell = ({ tableOptions: { kappSlug }, row }) => (
  <td className="actions-cell">
    <Link to={`/calendar/${row.get('slug')}`}>
      <button className="btn btn-primary">Open Calendar</button>
    </Link>
  </td>
);

// overriding the default table empty body row
const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Calendars...',
  noItemsMessage: 'There are no Calendars to display.',
});

export const CalendarList = () => {
  const kappSlug = CALENDAR_KAPP_SLUG;

  return (
    <FormTable
      kappSlug={kappSlug}
      columnSet={['name', 'actions']}
      components={{ ...TableComponents, EmptyBodyRow }} // overridden components from above
      initialFilterValues={{ type: 'Calendar' }}
      addColumns={[
        {
          value: 'actions',
          title: ' ',
          components: {
            BodyCell: ActionsCell,
          },
        },
      ]}
      alterColumns={{
        name: {
          components: {
            BodyCell: NameCell,
          },
        },
      }}
      sortable={false}
    >
      {({ pagination, table }) => (
        <>
          <h1>Calendars</h1>
          <div>
            {table}
            {/* {pagination} */}
          </div>
        </>
      )}
    </FormTable>
  );
};
