import React, { useState } from 'react';
import { logout } from '@kineticdata/react';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

// Dropdown menu with user info, link to profile page, and logout
const HeaderDropdownMenu = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Dropdown isOpen={isOpen} toggle={toggle}>
      <DropdownToggle role="button" caret>
        {profile ? profile.displayName : 'Menu'}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem>
          <>
            <h5>
              {profile ? profile.displayName : 'Username'}
              <br />
              <small>{profile ? profile.email : 'Email'}</small>
            </h5>
          </>
        </DropdownItem>
        <DropdownItem divider />
        <DropdownItem>
          <Link to="/profile" className="profile-menu-link" onClick={toggle}>
            View/Edit Profile
          </Link>
        </DropdownItem>
        <DropdownItem>
          <Link to="/" onClick={logout} className="profile-menu-link">
            Logout
          </Link>
        </DropdownItem>
        <div className="profile-menu-links"></div>
      </DropdownMenu>
    </Dropdown>
  );
};

export const Header = ({ space, loggedIn, profile }) => (
  <Navbar>
    <NavbarBrand href="/">
      <img
        alt="logo"
        src={logo}
        style={{
          height: 60,
        }}
      />
    </NavbarBrand>
    {loggedIn && (
      <div className="buttons">
        <HeaderDropdownMenu profile={profile} />
      </div>
    )}
  </Navbar>
);
