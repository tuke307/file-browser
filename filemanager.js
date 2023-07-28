import * as Api from "./api.js";
import { showNotification, toggleVisibility, hideAllViews } from "./utils.js";

let files = null;
let selectedFile = null;

let currentPath = [];

function createActionsCell(file) {
  const actionsCell = document.createElement("td");
  
  const actionsContainer = document.createElement("div");
  actionsContainer.classList.add("actions");

  actionsCell.appendChild(actionsContainer);

  if (file.Type !== "dir") {
    const downloadButton = createIconButton("fa-download", "Herunterladen");
    downloadButton.addEventListener(
      "click",
      async () => await downloadFile(file)
    );
    actionsContainer.appendChild(downloadButton);
  }

  if (file.Type === "text/plain") {
    const editButton = createIconButton("fa-edit", "Bearbeiten");
    editButton.addEventListener("click", async () => await editTextFile(file));
    actionsContainer.appendChild(editButton);
  }

  const editButton = createIconButton("fa-trash", "Löschen");
  editButton.addEventListener("click", async () => await deleteItem(file));
  actionsContainer.appendChild(editButton);

  return actionsCell;
}

export function createRow(file) {
  const row = document.createElement("tr");

  const iconCell = createIconCell(file);
  row.appendChild(iconCell);

  const nameCell = createNameCell(file);
  row.appendChild(nameCell);

  const actionsCell = createActionsCell(file);
  row.appendChild(actionsCell);

  row.addEventListener("click", async () => {
    const fileName = file.Name;
    const fileType = file.Type;

    if (fileType === "dir") {
      await goToPath(fileName);
    } else {
      await viewFile(fileName);
    }
  });

  return row;
}

export function createIconCell(file) {
  const iconCell = document.createElement("td");
  const icon = document.createElement("i");

  if (file.Type === "dir") {
    icon.classList.add("fas", "fa-folder");
  } else if (file.Type.startsWith("image/")) {
    icon.classList.add("fas", "fa-image");
  } else if (file.Type.startsWith("video/")) {
    icon.classList.add("fas", "fa-video");
  } else if (file.Type.startsWith("audio/")) {
    icon.classList.add("fas", "fa-music");
  } else if (file.Type.startsWith("text/")) {
    icon.classList.add("fas", "fa-file-alt");
  } else if (file.Type.startsWith("application/pdf")) {
    icon.classList.add("fas", "fa-file-pdf");
  } else {
    icon.classList.add("fas", "fa-file");
  }

  iconCell.appendChild(icon);

  return iconCell;
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

export function createIconButton(iconClass, tooltip) {
  const button = document.createElement("button");

  const icon = document.createElement("i");
  icon.classList.add("fas", iconClass);
  button.appendChild(icon);

  return button;
}

export async function viewFile(name) {
  const path = [...currentPath, name].join("/");

  hideAllViews();
  const response = await Api.downloadFile(path);

  if (response.ok) {
    const contentType = response.headers.get("Content-Type");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (contentType.startsWith("image/")) {
      imageViewer.src = url;
      imageViewer.alt = name;
      toggleVisibility(imageViewContainer, true);
    } else if (contentType.startsWith("video/")) {
      videoViewer.src = url;
      videoViewer.alt = name;
      toggleVisibility(videoViewContainer, true);
    } else if (contentType.startsWith("audio/")) {
      audioViewer.src = url;
      audioViewer.alt = name;
      toggleVisibility(audioViewContainer, true);
    } else if (contentType.startsWith("application/pdf")) {
      pdfViewer.src = url;
      pdfViewer.alt = name;
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

export async function goToPath(name) {
  currentPath.push(name);

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

  hiddenInput.value = "";
}

export async function createTextFile() {
  
  let fileName = prompt("Please enter a file name:");

  if (fileName) {
    hideAllViews();
  
    textEditor.value = null;
    toggleVisibility(textViewContainer, true);

    selectedFile = new Blob([null], { type: "text/plain" });
    if (!fileName.endsWith(".txt")) {
      fileName += ".txt";
    }
    selectedFile.Name = fileName;
  } else {
    showNotification("Please enter a valid file name.");
  }
}
