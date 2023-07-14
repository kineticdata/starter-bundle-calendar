import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { App, EmptyBodyRow } from './App';
import * as LayoutComponents from './components/Layouts';
import { KineticLib, history as libHistory } from '@kineticdata/react';
import { store as reduxStore } from './redux/store';
import { ConnectedRouter } from 'connected-react-router';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('./globals');

// Create the redux store with the configureStore helper found in redux/store.js
// export const store = configureStore();
export const store = reduxStore;
export const history = libHistory;

ReactDOM.render(
  <KineticLib components={{ ...LayoutComponents, EmptyBodyRow }} locale="en">
    {kineticProps => (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App globals={globals} {...kineticProps} />
        </ConnectedRouter>
      </Provider>
    )}
  </KineticLib>,
  document.getElementById('root'),
);
