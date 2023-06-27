import { BASE_URL } from "./config.js";
import { showNotification, toggleVisibility } from "./utils.js";

const loginContainer = document.getElementById("login-container");
const fileContainer = document.getElementById("file-container");
const backButton = document.getElementById("backBtn");

const fileInput = document.getElementById("fileInput");
const uploadForm = document.getElementById("uploadForm");

const createDirForm = document.getElementById("createDirForm");
const dirNameInput = document.getElementById("dirName");

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

backButton.addEventListener("click", goBack);

uploadForm.addEventListener("submit", uploadFile);

createDirForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dirName = document.getElementById("dirName").value;
  await createDirectory(dirName);
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

function updateFileList(files) {
  let fileList = document.getElementById("file-list");
  fileList.innerHTML = "";

  for (let file of files) {
    let row = document.createElement("tr");

    let nameCell = document.createElement("td");
    let nameSpan = document.createElement("span");
    nameSpan.innerText = file.Name;
    nameCell.appendChild(nameSpan);
    if (file.Type === "dir") {
      nameSpan.classList.add("dir");
    } else {
      nameSpan.classList.add("file-name");
    }
    row.appendChild(nameCell);

    let typeCell = document.createElement("td");
    let typeSpan = document.createElement("span");
    typeSpan.innerText = file.Type;
    typeSpan.classList.add("file-type");
    typeCell.appendChild(typeSpan);
    row.appendChild(typeCell);

    let actionsCell = document.createElement("td");
    actionsCell.classList.add("actions");
    if (file.Type === "dir") {
      let openButton = createIconButton("fa-folder-open", "Öffnen");
      openButton.addEventListener("click", function () {
        goToPath(currentPath.length, file.Name);
      });
      actionsCell.appendChild(openButton);
    } else if (
      file.Type === "video/mp4" ||
      file.Type === "audio/mpeg" ||
      file.Type.startsWith("image/")
    ) {
      let viewButton = createIconButton("fa-eye", "Ansehen");
      viewButton.addEventListener("click", function () {
        viewFile(file.Name);
      });
      actionsCell.appendChild(viewButton);
    }

    let downloadButton = createIconButton("fa-download", "Herunterladen");
    downloadButton.addEventListener("click", function () {
      downloadFile(file.Name);
    });
    actionsCell.appendChild(downloadButton);

    let deleteButton = createIconButton("fa-trash-alt", "Löschen");
    deleteButton.addEventListener("click", function () {
      deleteFile(file.Name);
    });
    actionsCell.appendChild(deleteButton);

    row.appendChild(actionsCell);

    fileList.appendChild(row);
  }
}

function createIconButton(iconClass, tooltip) {
  let button = document.createElement("button");
  button.classList.add("icon-button");
  button.title = tooltip;
  let icon = document.createElement("i");
  icon.classList.add("fas", iconClass);
  button.appendChild(icon);
  return button;
}



function goToPath(index, name) {
  if (name) {
    currentPath.push(name);
  } else {
    currentPath.splice(index + 1);
  }
  fetchFiles();
}

function goBack() {
  if (currentPath.length > 0) {
    currentPath.pop();
    fetchFiles();
  }
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
  fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`
    }
  })
    .then(response => response.blob())
    .then(data => {
      // Create a URL for the file blob
      const fileUrl = URL.createObjectURL(data);
      
      // Open the file in a new tab/window
      window.open(fileUrl, "_blank");
    })
    .catch(error => {
      console.error(error);
    });
}


function downloadFile(name) {
  let path = [...currentPath, name].join("/");
  fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`
    }
  })
    .then(response => response.blob())
    .then(data => {
      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(data);
      downloadLink.download = name;
      
      // Programmatically click on the download link
      downloadLink.click();
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadLink.href);
    })
    .catch(error => {
      console.error(error);
    });
}

async function deleteFile(name) {
  if (confirm(`Möchtest du die Datei "${name}" wirklich löschen?`)) {
    let path = [...currentPath, name].join("/");
    const response = await fetch(`${BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`
      }
    });
    if (response.ok) {
      fetchFiles();
    } else {
      showNotification("Fehler beim Löschen der Datei");
    }
  }
}


function uploadFile(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  const file = fileInput.files[0]; // Get the selected file

  if (file) {
    const formData = new FormData(); // Create a new FormData object
    formData.append("newfile", file); // Append the file to the FormData object

    let path = currentPath.join("/");
    fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`
      },
      body: formData // Set the FormData object as the request body
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        // Process the response data, if needed
        console.log(data);
      })
      .catch(error => {
        console.error(error);
      });
  }
}

async function createDirectory(dirName) {
  const body = new URLSearchParams({
    type: "dir",
  });

  const path = currentPath.join("/");
  const response = await fetch(`${BASE_URL}/${path}/${dirName}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`,
    },
    body: body,
  });

  if (response.ok) {
    fetchFiles();
    dirNameInput.value = "";
  } else {
    showNotification("Failed to create directory.");
  }
}
