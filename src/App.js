import React from 'react';
// import './App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import { WallySpinner } from './components/Loading';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Form } from './components/Form';
import { CalendarList } from './components/CalendarList';
import { CalendarSettings } from './components/CalendarSettings';
import { Profile } from './components/Profile';
import { useProfile, useSpace } from './hooks';
import './assets/styles/master.scss';
import './assets/styles/react_dates_overrides.scss'

// use Wally for empty app
export const EmptyBodyRow = () => <WallySpinner />;
export const NotFound = props => <h1>Page Not Found</h1>;

export const App = ({ initialized, loggedIn, loginProps, timedOut }) => {
  // fetch and set space
  const space = useSpace();

  // fetch and set profile
  const profile = useProfile(loggedIn);

  return (
    <>
      <Header space={space} loggedIn={loggedIn} profile={profile} />
      {!initialized ? (
        <WallySpinner />
      ) : loggedIn ? (
        <main className="container-fluid m-2">
          <Switch>
            <Route
              path="/profile"
              render={() => <Profile profile={profile} />}
              exact
            />
            <Route
              path={['/', '/calendar']}
              render={() => (
                <CalendarList
                  authorized={profile && profile.authorization['Modification']}
                />
              )}
              exact
            />
            <Route
              path="/calendar/:formSlug"
              render={() => <Form profile={profile} />}
              exact
            />
            <Route
              path={['/calendar/:formSlug/settings']}
              render={() => <CalendarSettings />}
              exact
            />
            {/* Adding canonical route for when a builder hits the preview button from a form */}
            <Redirect
              from="/kapps/:kappSlug/forms/:formSlug"
              to="/calendar/:formSlug"
              noThrow
            />
            <Route component={NotFound} />
          </Switch>
        </main>
      ) : (
        <Login {...loginProps} />
      )}
      {timedOut && (
        <dialog open>
          <Login {...loginProps} />
        </dialog>
      )}
    </>
  );
};
