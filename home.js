import * as helpers from './helpers.js';


document
    .getElementById("logout-button")
    .addEventListener("click", function (event) {
        event.preventDefault();
        logout();
    });


function logout() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/logout");
    xhr.setRequestHeader("Authorization", "Basic " + window.localStorage.getItem("access_token"));
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      if (xhr.status === 200) {
        window.localStorage.setItem("access_token", null);
        window.location.href = "login.html"; // Leite den Benutzer zur login seite weiter
      } else {
        helpers.showNotification("Fehler");
      }
    };
    xhr.send();
  }
