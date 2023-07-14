# Kinetic Starter App

This project is meant to be a no frills starting point for kinetic app bundle development. The bundle exposing public pages is also a non-trivial use case that our bundle uses out of the box and introduces client-side routing into the mix.

## Kinetic Component Library

Kinetic data has developed the [React Kinetic Library (RKL) component library](https://components.kineticdata.com/) for use with the Kinetic Platform. RKL provides API and UI elements that enhances the developer experience through the use of shared components.

## KineticLib Component

#### Render Props

The following are the props that get passed to the render component passed to `KineticLib`

- `initialized` - True when we have determined whether or not the user is authenticated. If the user is initially
  authenticated we will also fetch the JWT before this is set to true
- `loggedIn` - The user has been authenticated and should be able to navigate to areas of the application that require
  authentication
- `timedOut` - The user was previously authenticated but a subsequent request has returned a 401 and the user needs to
  reauthenticate. We leave `loggedIn` true because we do not necessarily want to redirect from the current
  page and erase user state.
- `loginProps` - Props intended for use by a `Login` component
  - `error` - Error returned from failed authentication attempt
  - `onChangePassword` - Change event handler to place placed on the password field
  - `onChangeUsername` - Change event handler to place placed on the username field
  - `onLogin` - Submit event to be placed on the submit button of the login form, also takes a second argument that is
    a callback invoked when the user successfully authenticates
  - `password` - Value to be present in the password field
  - `pending` - Currently attempting to authenticate or retrieving JWT
  - `username` - Value to be present in the username field

## Login Component

The `Login` component is the primary piece in this implementation. It shows how to use the `loginProps` received from
the `KineticLib` component and also how to add some extra functionality like password reset and sign up forms.

#### Redirect

The `redirect` prop should be set to true when we have reach `Login` by an explicit route like `/login` or `/sign-up`.
In this case the user should be redirected to some kind of home page after they have successfully authenticated. This
example just makes a direct call to `history.push` to do so.

#### Component State vs Route

There are two things that drive which form the `Login` component will show. If the login is displayed because the user
has navigated to a secure route (like /submissions in this project) we want to show the login form without changing the
route. Without changing the route, when the user successfully authenticates the `loggedIn` prop passed to the
`KineticLib` render prop will become true and the correct component will automatically be rendered.

We also want to support links directly to things like the sign up or password reset form. So we still add routes for
these and render `Login` at those routes. To keep things simple the links to _Sign up_ or _Password Reset_ still just
change component state to display the correct form. Otherwise we would another option to `Login` and then conditionally
render `<a>` or `<button>`. We thought this added more complication to the implementation than it was worth.

#### Cancel Button

The cancel button on the modal login is just passed the same function as the normal logout button. Even though the user
is currently unauthenticated this indicates to the `KineticLib` component that the user intends to fully logout, it will
then update its internal state setting `loggedIn` to false and in our implementation the user will be redirected to "/".
