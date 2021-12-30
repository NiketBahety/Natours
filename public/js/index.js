/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login } from './login';
import { logout } from './login';
import { updateSettings } from './updateSettings';

const loginForm = document.querySelector('.login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');

// console.log(loginForm);

if (loginForm) {
   loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      // console.log('This is from index.js', email, password);
      login(email, password);
   });
}

const mapBox = document.getElementById('map');

if (mapBox) {
   const locations = JSON.parse(mapBox.dataset.locations);
   displayMap(locations);
}

if (logoutBtn) {
   logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
   userDataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);
      updateSettings(form, 'data');
   });
}

if (userPasswordForm) {
   userPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      document.querySelector('.btn--save-password').textContent = 'Updating...';
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      await updateSettings(
         { passwordCurrent, password, passwordConfirm },
         'password'
      );

      document.querySelector('.btn--save-password').textContent =
         'SAVE PASSWORD';

      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
   });
}
