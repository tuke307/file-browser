import { toggleVisibility } from "./utils.js";
import * as Filemanager from "./filemanager.js";
import * as Authentication from "./authentication.js";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  await Authentication.login(username, password);
});

logoutButton.addEventListener("click", async () => await Authentication.logout());

backButton.addEventListener("click", async () => await Filemanager.goBack());

fileInput.addEventListener("change", async () => {

  const file = fileInput.files[0];

  await Filemanager.uploadFile(file);
});

createDirButton.addEventListener("click", () => toggleVisibility(createDirPopout, true));

saveDirButton.addEventListener("click", async () => await Filemanager.createDirectory());

cancelDirButton.addEventListener("click", () => toggleVisibility(createDirPopout, false));

cancelEditButton.addEventListener("click", async () => await cancelFileEdit());

saveEditButton.addEventListener("click", async () => await Filemanager.saveFile());