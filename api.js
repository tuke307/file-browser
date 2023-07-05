

export async function login(username, password) {
  const body = new URLSearchParams({
    username: username,
    password: password,
  });

  try {
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
    }

    return response;
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function logout() {
  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
    }

    return response;
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function fetchFiles(path) {
  try {
    return await fetch(`${BASE_URL}/${path}/`, {
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
    });
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function downloadFile(path) {
  try {
    return await fetch(`${BASE_URL}/${path}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
    });
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function deleteItem(path) {
  try {
    return await fetch(`${BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
    });
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function uploadFile(path, file) {

  const formData = new FormData();
  formData.append("newFile", file, file.name);

  try {
    return await fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
        //this isnt really working: "Content-Type": "multipart/form-data",
      },
      body: formData,
    });
  } catch (error) {
    console.error("API ERROR:", error);
  }
}

export async function createDirectory(path) {
  const body = new URLSearchParams({
    type: "dir",
  });

  try {
    return await fetch(`${BASE_URL}/${path}/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${sessionStorage.getItem("token")}`,
      },
      body: body,
    });
  } catch (error) {
    console.error("API ERROR:", error);
  }
}
