export const apiOrigin = (function () {
  function apiBase() {
    switch (process.env.NODE_ENV) {
      case 'development':
        return `http://${window.location.hostname}:5000`;
      default:
        return 'https://blackjack-trainer.herokuapp.com';
    }
  }

  return `${apiBase()}/api/v1`;
})();
