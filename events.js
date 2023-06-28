import { showNotification, toggleVisibility } from "./utils.js";
import * as Api from "./api.js";

// Login Container
const loginContainer = document.getElementById("login-container");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// File Container
const fileContainer = document.getElementById("file-container");
const logoutButton = document.getElementById("logoutBtn");
const backButton = document.getElementById("backBtn");

// File Upload
const fileInput = document.getElementById("fileInput");
const uploadForm = document.getElementById("uploadForm");

// Dir creation
const createDirForm = document.getElementById("createDirForm");
const dirNameInput = document.getElementById("dirName");

// Viewer + Editor
const textEditor = document.getElementById("textEditor");
const cancelButton = document.getElementById("cancelBtn");
const saveButton = document.getElementById("saveBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  await Api.login(username, password);
});

logoutButton.addEventListener("click", async () => {
  e.preventDefault();
  
  await Api.logout();

  // empty form
  usernameInput.value = "";
  passwordInput.value = "";

  toggleVisibility(fileContainer);
  toggleVisibility(loginContainer);
});

backButton.addEventListener("click", async (e) => {
  e.preventDefault();

  await Api.goBack();
});


fileInput.addEventListener("change", async function(e) {
  e.preventDefault();
  
  await Api.uploadFile(this.files[0]);
});

createDirForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await Api.createDirectory(dirNameInput.value);
  dirNameInput.value = "";
});

cancelButton.addEventListener("click", async (e) => {
  e.preventDefault();

  await Api.cancelEditing();
});

saveButton.addEventListener("click", async (e) => {
  e.preventDefault();

  await Api.saveFile();
});
