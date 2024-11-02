window.onload = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("../serviceWorker.js", { scope: "/", updateViaCache: "none" })
      .then(() => console.log("Service Worker: Registered"));
  }
};
