import { showNotification, toggleVisibility } from "./utils.js";
import * as Api from "./api.js";

// Global variables
let files = null;
let selectedFile = null;

let currentPath = [];

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  let response = await Api.login(username, password);

  if (response?.status === 200) {
    // otherwise, username and password would be visible in the URL
    window.history.replaceState({}, document.title, "/");

    // hide login container
    toggleVisibility(loginContainer, false);
    toggleVisibility(fileContainer, true);

    await fetchFiles();
  } else if (response?.status === 401) {
    showNotification("Please enter a valid username and password");
  } else {
    showNotification("Database error. Please try again later.");
  }
});

logoutButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const response = await Api.logout();

  if (response?.ok) {
    // empty form
    usernameInput.value = "";
    passwordInput.value = "";

    toggleVisibility(fileContainer, false);
    toggleVisibility(loginContainer, true);
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }
});

backButton.addEventListener("click", async (e) => {
  e.preventDefault();

  await goBack();
});

fileInput.addEventListener("change", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];

  const response = await Api.uploadFile(file);

  if (response?.ok) {
    await fetchFiles();
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }

  fileInput.value = "";
});

createDirButton.addEventListener("click", () => {
  toggleVisibility(createDirPopout, true);
});

saveDirButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const dirName = dirNameInput.value.trim();

  if (dirName !== "") {
    let path = [...currentPath, dirName].join("/");

    const response = await Api.createDirectory(path);

    if (response?.ok) {
      dirNameInput.value = "";
      toggleVisibility(createDirPopout, false);
      await fetchFiles();
    } else if (response?.status === 401) {
      showNotification("Token expired. Please log in again.");
    } else {
      showNotification("Database error. Please try again later.");
    }
  }
});

cancelDirButton.addEventListener("click", () => {
  toggleVisibility(createDirPopout, false);
});

cancelButton.addEventListener("click", async (e) => {
  e.preventDefault();

  selectedFile = null;
  textEditor.value = "";
  toggleVisibility(textViewContainer, false);
});

saveButton.addEventListener("click", async (e) => {
  e.preventDefault();

  // same as upload file
  let path = [...currentPath, selectedFile.Name].join("/");

  const response = await Api.uploadFile(path, selectedFile);

  if (response?.ok) {
    selectedFile = null;
    textEditor.value = "";
    toggleVisibility(textViewContainer, true);
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }
});

export async function updateFileList(files) {
  fileList.innerHTML = "";

  for (let file of files) {
    const row = createRow(file);
    fileList.appendChild(row);
  }
}

function createRow(file) {
  const row = document.createElement("tr");

  const nameCell = createNameCell(file);
  row.appendChild(nameCell);

  const typeCell = createTypeCell(file);
  row.appendChild(typeCell);

  const actionsCell = createActionsCell(file);
  row.appendChild(actionsCell);

  return row;
}

function createNameCell(file) {
  const nameCell = document.createElement("td");
  const nameSpan = document.createElement("span");
  nameSpan.innerText = file.Name;
  nameCell.appendChild(nameSpan);

  if (file.Type === "dir") {
    nameSpan.classList.add("dir");
  } else {
    nameSpan.classList.add("file-name");
  }

  return nameCell;
}

function createTypeCell(file) {
  const typeCell = document.createElement("td");
  const typeSpan = document.createElement("span");
  typeSpan.innerText = file.Type;
  typeSpan.classList.add("file-type");
  typeCell.appendChild(typeSpan);

  return typeCell;
}

function createActionsCell(file) {
  const actionsCell = document.createElement("td");
  actionsCell.classList.add("actions");

  if (file.Type === "dir") {
    const openButton = createIconButton("fa-folder-open", "Öffnen");
    openButton.addEventListener("click", async function () {
      await goToPath(currentPath.length, file.Name);
    });
    actionsCell.appendChild(openButton);
  } else {
    const downloadButton = createIconButton("fa-download", "Herunterladen");
    downloadButton.addEventListener("click", async function () {
      const path = [...currentPath, file.Name].join("/");
      const response = await Api.downloadFile(path);

      if (response.ok) {
        const data = await response.blob();

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(data);
        downloadLink.download = file.Name;

        // Programmatically click on the download link
        downloadLink.click();

        // Clean up the URL object
        URL.revokeObjectURL(downloadLink.href);
      } else {
        showNotification("Error downloading file. Please try again.");
      }
    });
    actionsCell.appendChild(downloadButton);
  }

  if (file.Type === "text/plain") {
    const editButton = createIconButton("fa-edit", "Bearbeiten");
    editButton.addEventListener("click", async function () {
      const path = [...currentPath, file.Name].join("/");

      hideAllViews();
      const response = await Api.editTextFile(path);

      if (response.ok) {
        const contentType = response.headers.get("Content-Type");
        if (contentType.startsWith("text/")) {
          const content = await response.text();

          selectedFile = file;

          textEditor.value = content;
          toggleVisibility(textViewContainer, true);
        }
      } else {
        showNotification("Error viewing file. Please try again.");
      }
    });
    actionsCell.appendChild(editButton);
  } else {
    if (file.Type != "dir") {
      const viewButton = createIconButton("fa-eye", "Ansehen");
      viewButton.addEventListener("click", async function () {
        const path = [...currentPath, file.Name].join("/");

        hideAllViews();
        const response = await Api.viewFile(path);

        if (response.ok) {
          const contentType = response.headers.get("Content-Type");
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          if (contentType.startsWith("image/")) {
            imageViewer.src = url;
            imageViewer.alt = file.Name;
            toggleVisibility(imageViewContainer, true);
          } else if (contentType.startsWith("video/")) {
            videoViewer.src = url;
            videoViewer.alt = file.Name;
            toggleVisibility(videoViewContainer, true);
          } else if (contentType.startsWith("audio/")) {
            audioViewer.src = url;
            audioViewer.alt = file.Name;
            toggleVisibility(audioViewContainer, true);
          } else if (contentType.startsWith("application/pdf")) {
            pdfViewer.src = url;
            pdfViewer.alt = file.Name;
            toggleVisibility(pdfViewContainer, true);
          }
        } else {
          showNotification("Error viewing file. Please try again.");
        }
      });
      actionsCell.appendChild(viewButton);
    }
  }

  const editButton = createIconButton("fa-trash", "Löschen");
  editButton.addEventListener("click", async function () {
    const path = [...currentPath, file.Name].join("/");

    if (confirm("Are you sure you want to delete this file?")) {
      const response = await Api.deleteItem(path);

      if (response?.ok) {
        await fetchFiles();
      } else if (response?.status === 401) {
        showNotification("Token expired. Please log in again.");
      } else {
        showNotification("Database error. Please try again later.");
      }
    }
  });
  actionsCell.appendChild(editButton);

  return actionsCell;
}

function createIconButton(iconClass, tooltip) {
  const button = document.createElement("button");
  button.classList.add("icon-button");

  const icon = document.createElement("i");
  icon.classList.add("fas", iconClass);
  button.appendChild(icon);

  const tooltipSpan = document.createElement("span");
  tooltipSpan.classList.add("tooltip");
  tooltipSpan.innerText = tooltip;
  button.appendChild(tooltipSpan);

  return button;
}

async function goToPath(index, name) {
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

async function fetchFiles() {
  let path = currentPath.join("/");
  const response = await Api.fetchFiles(path);

  if (response?.ok) {
    hideAllViews();

    files = await response.json();
    await updateFileList(files);
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }
}

// hide all views
function hideAllViews() {
  toggleVisibility(imageViewContainer, false);
  toggleVisibility(videoViewContainer, false);
  toggleVisibility(audioViewContainer, false);
  toggleVisibility(pdfViewContainer, false);
  toggleVisibility(textViewContainer, false);
}
