export function showNotification(message) {
    var notification = document.getElementById("notification");
    notification.innerHTML = message;
    notification.style.top = "0";
    setTimeout(function () {
      notification.style.top = "-100px";
    }, 3000);
  }