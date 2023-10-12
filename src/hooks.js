// fetch and set form
import { useEffect, useState } from 'react';
import {
  fetchForm,
  fetchKapp,
  fetchProfile,
  fetchSpace,
  updateForm as formUpdate,
} from '@kineticdata/react';

export const useForm = (kappSlug, formSlug) => {
  const [form, setForm] = useState(null);

  useEffect(() => {
    const fetchFormRequest = async () => {
      const response = await fetchForm({ kappSlug, formSlug, include: 'details,attributesMap' });
      setForm(response.form);
    };

    fetchFormRequest().catch(console.error);
  }, [kappSlug, formSlug, setForm]);

  return form;
};

export const updateConfig = async (kappSlug, formSlug, calendarConfig) => {

  const response = await formUpdate ({
    kappSlug: kappSlug,
    formSlug: formSlug,
    form: { attributesMap: { 'Calendar Config': [calendarConfig] } },
  });
}

export const useKapp = kappSlug => {
  const [kapp, setKapp] = useState(null);
  useEffect(() => {
    const fetchKappRequest = async () => {
      const response = await fetchKapp({ kappSlug });
      setKapp(response.kapp);
    };
    fetchKappRequest().catch(console.error);
  }, [kappSlug]);

  return kapp;
};

export const useSpace = () => {
  const [space, setSpace] = useState(null);
  useEffect(() => {
    const fetchSpaceRequest = async () => {
      const response = await fetchSpace();
      setSpace(response.space);
    };
    fetchSpaceRequest().catch(console.error);
  }, []);

  return space;
};

export const useProfile = loggedIn => {
  const [profile, setProfile] = useState();
  useEffect(() => {
    const fetchProfileRequest = async () => {
      const response = await fetchProfile({ include: 'authorization' });
      setProfile(response.profile);
    };
    fetchProfileRequest().catch(console.error);
  }, [loggedIn]);

  return profile;
};