import * as Api from "./api.js";
import * as Filemanager from "./filemanager.js";
import { toggleVisibility, showNotification } from "./utils.js";


export async function logout() {
  const response = await Api.logout();

  if (response?.ok) {
    Filemanager.resetPath();
    usernameInput.value = "";
    passwordInput.value = "";

    toggleVisibility(fileContainer, false);
    toggleVisibility(loginContainer, true);
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }
}

export async function login(username, password) {
  let response = await Api.login(username, password);

  if (response?.status === 200) {
    // otherwise, username and password would be visible in the URL
    window.history.replaceState({}, document.title, "/");

    // hide login container
    toggleVisibility(loginContainer, false);
    toggleVisibility(fileContainer, true);

    await Filemanager.fetchFiles();
  } else if (response?.status === 401) {
    showNotification("Please enter a valid username and password");
  } else {
    showNotification("Database error. Please try again later.");
  }
}
