import { BASE_URL } from "./config.js";
import { showNotification, toggleVisibility } from "./utils.js";

const loginContainer = document.getElementById("login-container");
const fileContainer = document.getElementById("file-container");

let currentPath = [];

function main() {}

window.addEventListener("load", main);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  await login(username, password);
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await logout();

    // empty form
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    toggleVisibility(fileContainer);
    toggleVisibility(loginContainer);
  } catch (error) {
    showNotification(error.message);
  }
});



async function login(username, password) {
  const body = new URLSearchParams({
    username: username,
    password: password,
  });

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body,
  });

  if (response.ok) {
    const { token } = await response.json();
    const credentials = btoa(`${username}:${token}`);
    sessionStorage.setItem("token", credentials);
    sessionStorage.setItem("username", username);

    // otherwise, username and password would be visible in the URL
    window.history.replaceState({}, document.title, "/");

    // hide login container
    toggleVisibility(loginContainer);
    toggleVisibility(fileContainer);

    updateBreadcrumb();
    fetchFiles();
  } else if (response.status === 401) {
    showNotification("Please enter a valid username and password");
  } else {
    showNotification("Database error. Please try again later.");
  }
}

async function logout() {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`,
    },
  });

  if (response.ok) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    return true;
  } else {
    const error = await response.text();
    throw new Error(error);
  }
}

function updateBreadcrumb() {
  let breadcrumb = document.getElementById("breadcrumb");
  breadcrumb.innerHTML = "";
  for (let i = 0; i < currentPath.length; i++) {
    let pathPart = currentPath[i];
    let button = document.createElement("button");
    button.innerText = pathPart;
    button.addEventListener("click", function () {
      goToPath(i);
    });
    breadcrumb.appendChild(button);
  }
}

function updateFileList(files) {
  let fileList = document.getElementById("file-list");
  fileList.innerHTML = "";
  for (let file of files) {
    let li = document.createElement("li");
    let nameSpan = document.createElement("span");
    nameSpan.innerText = file.Name;
    li.appendChild(nameSpan);

    if (file.Type === "dir") {
      let openButton = document.createElement("button");
      openButton.innerText = "Öffnen";
      openButton.addEventListener("click", function () {
        goToPath(currentPath.length, file.Name);
      });
      li.appendChild(openButton);
    } else if (
      file.Type === "video/mp4" ||
      file.Type === "audio/mpeg" ||
      file.Type.startsWith("image/")
    ) {
      let viewButton = document.createElement("button");
      viewButton.innerText = "Ansehen";
      viewButton.addEventListener("click", function () {
        viewFile(file.Name);
      });
      li.appendChild(viewButton);
    }

    let downloadButton = document.createElement("button");
    downloadButton.innerText = "Herunterladen";
    downloadButton.addEventListener("click", function () {
      downloadFile(file.Name);
    });
    li.appendChild(downloadButton);

    let deleteButton = document.createElement("button");
    deleteButton.innerText = "Löschen";
    deleteButton.addEventListener("click", function () {
      deleteFile(file.Name);
    });
    li.appendChild(deleteButton);

    fileList.appendChild(li);
  }
}


function goToPath(index, name) {
  if (name) {
    currentPath.push(name);
  } else {
    currentPath.splice(index + 1);
  }
  updateBreadcrumb();
  fetchFiles();
}

function fetchFiles() {
  let path = currentPath.join("/");
  fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`
    }
  })
    .then((response) => response.json())
    .then((files) => updateFileList(files));
}

function viewFile(name) {
  let path = [...currentPath, name].join("/");
  window.open(`${BASE_URL}/${path}`);
}

function downloadFile(name) {
  let path = [...currentPath, name].join("/");
  window.open(`${BASE_URL}/${path}?format=base64`);
}

function deleteFile(name) {
  if (confirm(`Möchtest du die Datei "${name}" wirklich löschen?`)) {
    let path = [...currentPath, name].join("/");
    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", `${BASE_URL}/${path}`);
    xhr.setRequestHeader(
      "Authorization",
      "Basic " + sessionStorage.getItem("access_token")
    );
    xhr.onload = function () {
      if (xhr.status === 200) {
        fetchFiles();
      } else {
        helpers.showNotification("Fehler beim Löschen der Datei");
      }
    };
    xhr.send();
  }
}
