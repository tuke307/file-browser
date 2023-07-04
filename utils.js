export function showNotification(message) {
    notification.innerHTML = message;
    notification.style.top = "0";
    setTimeout(function () {
      notification.style.top = "-100px";
    }, 3000);
  }

  export function toggleVisibility(element, visible) {
    element.style.display = visible ? "block" : "none";
  }
  