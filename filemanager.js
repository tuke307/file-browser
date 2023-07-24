import * as Api from "./api.js";
import { showNotification, toggleVisibility, hideAllViews } from "./utils.js";

let files = null;
let selectedFile = null;

let currentPath = [];

function createActionsCell(file) {
  const actionsCell = document.createElement("td");
  actionsCell.classList.add("actions");

  if (file.Type === "dir") {
    const openButton = createIconButton("fa-folder-open", "Öffnen");
    openButton.addEventListener(
      "click",
      async () => await goToPath(currentPath.length, file.Name)
    );
    actionsCell.appendChild(openButton);
  } else {
    const downloadButton = createIconButton("fa-download", "Herunterladen");
    downloadButton.addEventListener(
      "click",
      async () => await downloadFile(file)
    );
    actionsCell.appendChild(downloadButton);
  }

  if (file.Type === "text/plain") {
    const editButton = createIconButton("fa-edit", "Bearbeiten");
    editButton.addEventListener("click", async () => await editTextFile(file));
    actionsCell.appendChild(editButton);
  } else {
    if (file.Type != "dir") {
      const viewButton = createIconButton("fa-eye", "Ansehen");
      viewButton.addEventListener("click", async () => await viewFile(file));
      actionsCell.appendChild(viewButton);
    }
  }

  const editButton = createIconButton("fa-trash", "Löschen");
  editButton.addEventListener("click", async () => await deleteItem(file));
  actionsCell.appendChild(editButton);

  return actionsCell;
}

export function createRow(file) {
  const row = document.createElement("tr");

  const nameCell = createNameCell(file);
  row.appendChild(nameCell);

  const typeCell = createTypeCell(file);
  row.appendChild(typeCell);

  const actionsCell = createActionsCell(file);
  row.appendChild(actionsCell);

  return row;
}

export function createNameCell(file) {
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

export function createTypeCell(file) {
  const typeCell = document.createElement("td");
  const typeSpan = document.createElement("span");
  typeSpan.innerText = file.Type;
  typeSpan.classList.add("file-type");
  typeCell.appendChild(typeSpan);

  return typeCell;
}

export function createIconButton(iconClass, tooltip) {
  const button = document.createElement("button");

  const icon = document.createElement("i");
  icon.classList.add("fas", iconClass);
  button.appendChild(icon);

  return button;
}

export async function viewFile(file) {
  const path = [...currentPath, file.Name].join("/");

  hideAllViews();
  const response = await Api.downloadFile(path);

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
}

export async function editTextFile(file) {
  const path = [...currentPath, file.Name].join("/");

  hideAllViews();
  const response = await Api.downloadFile(path);

  if (response.ok) {
    const contentType = response.headers.get("Content-Type");
    if (contentType.startsWith("text/")) {
      selectedFile = await response.blob();
      selectedFile.Name = file.Name;
      const content = await selectedFile.text();

      textEditor.value = content;
      toggleVisibility(textViewContainer, true);
    }
  } else {
    showNotification("Error viewing file. Please try again.");
  }
}

export async function downloadFile(file) {
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
}

export async function deleteItem(item) {
  const path = [...currentPath, item.Name].join("/");

  // 
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
}

export async function updateFileList(files) {
  fileList.innerHTML = "";

  for (let file of files) {
    const row = createRow(file);
    fileList.appendChild(row);
  }
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
  // update browser history
  window.history.pushState({}, "", `?path=${currentPath.join("/")}`);
  // show last directory in path
  pathView.innerText = "path: /" + (currentPath[currentPath.length - 1] || "root");

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

export async function createDirectory(dirName) {
  dirName = dirNameInput.value.trim();

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
  } else {
    showNotification("Please enter a valid directory name.");
  }
}

export async function saveFile() {
  let path = [...currentPath, selectedFile.Name].join("/");

  // change the text value of selectedFile blob to the textEditor value
  let newFile = new Blob([textEditor.value], { type: "text/plain" });
  newFile.Name = selectedFile.Name;

  const response = await Api.uploadFile(path, newFile);

  if (response?.ok) {
    selectedFile = null;
    textEditor.value = "";
    toggleVisibility(textViewContainer, false);

    // only for creating text files
    await fetchFiles();
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }
}

export async function cancelFileEdit() {
  selectedFile = null;
  textEditor.value = "";
  toggleVisibility(textViewContainer, false);
}

export function resetPath() {
  currentPath = [];
}

export async function uploadFile(file) {
  let path = [...currentPath, file.name].join("/");
  const response = await Api.uploadFile(path, file);

  if (response?.ok) {
    await fetchFiles();
  } else if (response?.status === 401) {
    showNotification("Token expired. Please log in again.");
  } else {
    showNotification("Database error. Please try again later.");
  }

  fileInput.value = "";
}

export async function createTextFile() {
  
  let fileName = prompt("Please enter a file name:");

  if (fileName) {
    hideAllViews();
  
    textEditor.value = null;
    toggleVisibility(textViewContainer, true);

    selectedFile = new Blob([null], { type: "text/plain" });
    selectedFile.Name = fileName;
  } else {
    showNotification("Please enter a valid file name.");
  }
}
