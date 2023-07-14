import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { ProfileForm } from '@kineticdata/react';

// spec for change password field
const ChangePasswordField = props =>
  props.visible && (
    <div className="row">
      <div className="col-12">
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() => props.onChange({ target: { checked: !props.value } })}
        >
          {props.value ? 'Cancel Change Password' : 'Change Password'}
        </button>
      </div>
    </div>
  );

export const Profile = ({ profile }) => {
  const history = useHistory();

  // Form Saves
  const handleSave = useCallback(() => () => history.push('/'), [history]);

  return (
    <div className="mx-auto" style={{ width: '500px' }}>
      <h1>Edit Profile</h1>
      <div className="profile-form">
        <ProfileForm
          profile={profile}
          fieldSet={[
            'email',
            'displayName',
            'password',
            'passwordConfirmation',
            'changePassword',
          ]}
          alterFields={{
            changePassword: {
              component: ChangePasswordField,
            },
          }}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};
