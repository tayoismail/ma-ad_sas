export function retryLazy(importFn, maxRetries = 2, delay = 1500) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      importFn()
        .then(resolve)
        .catch((err) => {
          if (n < maxRetries) {
            setTimeout(() => attempt(n + 1), delay);
          } else {
            reject(err);
          }
        });
    };
    attempt(0);
  });
}
