import { BASE_URL } from "./config.js";
import { showNotification, toggleVisibility } from "./utils.js";

// Login Container
const loginContainer = document.getElementById("login-container");

// File Container
const fileContainer = document.getElementById("file-container");

// Viewer + Editor
const textEditor = document.getElementById("textEditor");
const viewContainer = document.getElementById("viewer-container");


let selectedFile = null;

let currentPath = [];


export async function login(username, password) {
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

    await fetchFiles();
  } else if (response.status === 401) {
    showNotification("Please enter a valid username and password");
  } else {
    showNotification("Database error. Please try again later.");
  }
}

export async function logout() {
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

export async function updateFileList(files) {
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
      openButton.addEventListener("click",  async function () {
        await goToPath(currentPath.length, file.Name);
      });
      actionsCell.appendChild(openButton);
    } else if (file.Type === "txt") {
      let editButton = createIconButton("fa-edit", "Bearbeiten");
      editButton.addEventListener("click",  async function () {
        await editTextFile(file.Name);
      });

    } else 
    {
      let viewButton = createIconButton("fa-eye", "Ansehen");
      viewButton.addEventListener("click",  async function () {
        await viewFile(file.Name);
      });
      actionsCell.appendChild(viewButton);
    }

    let downloadButton = createIconButton("fa-download", "Herunterladen");
    downloadButton.addEventListener("click",  async function () {
      await downloadFile(file.Name);
    });
    actionsCell.appendChild(downloadButton);

    let deleteButton = createIconButton("fa-trash-alt", "Löschen");
    deleteButton.addEventListener("click",  async function () {
      await deleteItem(file.Name, file.Type);
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

export async function goToPath(index, name) {
  if (name) {
    currentPath.push(name);
  } else {
    currentPath.splice(index + 1);
  }
  await fetchFiles();
}

export async function goBack() {
  if (currentPath.length > 0) {
    currentPath.pop();
    await fetchFiles();
  }
}

export async function fetchFiles() {
  let path = currentPath.join("/");
  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`,
    },
  });

  if (response.ok) {
    const files = await response.json();
    await updateFileList(files);
  }  else{
      showNotification("Database error. Please try again later.");
    }
}


export async function viewFile(name) {
  let path = [...currentPath, name].join("/");

  const response = await fetch(`${BASE_URL}/${path}`, {
      headers: {
          Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
  });

  if (response.ok) {
      const contentType = response.headers.get("Content-Type");
      if (contentType.startsWith("text/")) {
          const content = await response.text();

          selectedFile = {
              name,
              content,
              path,
          };

          textEditor.value = content;
          toggleVisibility(textEditor);
      } else {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          // Display different file types based on content type
          if (contentType.startsWith("image/")) {
              viewContainer.innerHTML = `<img src="${url}" alt="Image">`;
          } else if (contentType.startsWith("video/")) {
              viewContainer.innerHTML = `<video controls><source src="${url}" type="${contentType}">Your browser does not support the video tag.</video>`;
          } else if (contentType.startsWith("audio/")) { 
              viewContainer.innerHTML = `<audio controls><source src="${url}" type="${contentType}">Your browser does not support the audio tag.</audio>`;
          } else {
              // For other file types, display the file in an iframe
              viewContainer.innerHTML = `<iframe src="${url}"></iframe>`;
          }

          toggleVisibility(viewContainer);
      }
  } else {
      showNotification("Error viewing file. Please try again.");
  }
}

export async function editTextFile(name){

}


export async function downloadFile(name) {
  let path = [...currentPath, name].join("/");

  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      Authorization: `Basic ${sessionStorage.getItem("token")}`,
    },
  });

  if(response.ok){
      var data = await response.blob();
    
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(data);
      downloadLink.download = name;

      // Programmatically click on the download link
      downloadLink.click();

      // Clean up the URL object
      URL.revokeObjectURL(downloadLink.href);
  }else{
    showNotification("Error downloading file. Pleasre try again.");
  }
}

export async function deleteItem(name, type) {
  if (
    confirm(
      `Möchtest du ${
        type === "dir" ? "den Ordner" : "die Datei"
      } "${name}" wirklich löschen?`
    )
  ) {
    let path = [...currentPath, name].join("/");
    const response = await fetch(`${BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      await fetchFiles();
    } else {
      showNotification(
        `Fehler beim Löschen ${type === "dir" ? "des Ordners" : "der Datei"}`
      );
    }
  }
}

export async function uploadFile(file) {
  if (file) {
    const formData = new FormData();
    formData.append("newfile", file);

    let path = currentPath.join("/");
    const response = await fetch(`${BASE_URL}/${path}/${file.name}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (response.ok) {
      await fetchFiles();
    } else {
      showNotification("Error uploading file.");
    }
  }
}

export async function createDirectory(dirName) {
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
    await fetchFiles();
  } else {
    showNotification("Failed to create directory.");
  }
}



function cancelEditing() {
  selectedFile = null;
  textEditor.value = "";
  toggleVisibility(textEditor);
}

export async function saveFile() {
  if (selectedFile) {
    selectedFile.content = textEditor.value;

    const response = await fetch(`${BASE_URL}/${selectedFile.path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
      body: selectedFile.content,
    });

    if (response.ok) {
      showNotification("File saved successfully.");
    } else {
      showNotification("Error saving file. Please try again.");
    }

    selectedFile = null;
    textEditor.value = "";
    toggleVisibility(textEditor);
  }
}