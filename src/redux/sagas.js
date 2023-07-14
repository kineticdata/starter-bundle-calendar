import { all } from 'redux-saga/effects';
import { watchCalendar } from './sagas/calendar';

// eslint-disable-next-line import/no-anonymous-default-export
export default function*() {
  yield all([watchCalendar()]);
}
