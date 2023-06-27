export function showNotification(message) {
    var notification = document.getElementById("notification");
    notification.innerHTML = message;
    notification.style.top = "0";
    setTimeout(function () {
      notification.style.top = "-100px";
    }, 3000);
  }

export function toggleVisibility(element) {
    if (element.style.display === "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
  }