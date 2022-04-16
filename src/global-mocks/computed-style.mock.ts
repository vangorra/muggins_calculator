// Noop style computing to keep angular rendering happy.
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => {
      return '';
    },
  }),
});
