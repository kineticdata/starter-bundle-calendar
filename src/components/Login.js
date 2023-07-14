import React, { useCallback } from 'react';
import { history } from '../index';

export const Login = ({
  error,
  onChangePassword,
  onChangeUsername,
  onLogin,
  password,
  pending,
  redirect,
  username,
}) => {
  const onSubmit = useCallback(
    event => {
      const redirectCallback = redirect ? () => history.push('/') : null;

      return onLogin(event, redirectCallback);
    },
    [onLogin, redirect],
  );

  return (
    <div className="mx-auto" style={{ width: '500px' }}>
      <span>
        <h1>Login</h1>
        <form>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              name="username"
              placeholder="Username"
              onChange={onChangeUsername}
              value={username}
            />
          </div>
          <div className="form-group">
            <input
              className="form-control"
              type="password"
              name="password"
              placeholder="Password"
              onChange={onChangePassword}
              value={password}
            />
          </div>
          <button
            className="btn btn-primary"
            disabled={pending}
            type="submit"
            onClick={onSubmit}
          >
            Login
          </button>
        </form>
      </span>
    </div>
  );
};
