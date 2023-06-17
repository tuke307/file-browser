import * as helpers from './helpers.js';

function main() {
  // Füge hier weitere Code hinzu, der beim Laden der Seite ausgeführt werden soll
}

// Rufe die Hauptmethode beim Laden der Seite auf
window.addEventListener("load", main);



function login(username, password) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:8080/login", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      window.localStorage.setItem("access_token", data.token);
      console.log(data.token);
      window.location.href = "home.html"; // Leite den Benutzer zur Startseite weiter
    } else if (xhr.status === 401) {
        helpers.showNotification("Benutzername oder Passwort falsch");
    } else {
        helpers.showNotification("Fehler mit der Datenbank");
    }
  };
  var params = 'username=' + username + '&password=' + password;
  xhr.send(params);
}

document
  .getElementById("login-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    login(username, password);
  });
