(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // helper.ts
  window.addEventListener("error", (e) => {
    fetch("/error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msg: e.error?.message || "Unknown error",
        stack: [{
          file: e.filename || "unknown",
          line: e.lineno || 0,
          col: e.colno || 0
        }]
      })
    }).catch(() => {
      console.error("Failed to report error to server");
    });
  });
  var replit = {
    getUser() {
      return fetch("/user").then((res) => res.json()).then((user) => user || null).catch(() => null);
    },
    auth() {
      return new Promise((resolve) => {
        const authComplete = /* @__PURE__ */ __name((e) => {
          if (e.data !== "auth_complete") {
            resolve(null);
            return;
          }
          window.removeEventListener("message", authComplete);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          this.getUser().then(resolve);
        }, "authComplete");
        window.addEventListener("message", authComplete);
        const w = 320;
        const h = 480;
        const left = screen.width / 2 - w / 2;
        const top = screen.height / 2 - h / 2;
        const authWindow = window.open(
          `https://repl.it/auth_with_repl_site?domain=${location.host}`,
          "_blank",
          `modal=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}, top=${top}, left=${left}`
        );
        if (!authWindow) {
          console.error("Popup blocked - unable to open auth window");
          resolve(null);
          return;
        }
        setTimeout(() => {
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          window.removeEventListener("message", authComplete);
          resolve(null);
        }, 3e4);
      });
    },
    getUserOrAuth() {
      return this.getUser().then((user) => {
        if (user) {
          return user;
        } else {
          return this.auth();
        }
      });
    },
    getData(key, def) {
      return fetch(`/db/${encodeURIComponent(key)}`).then((res) => res.json()).then((val) => {
        if (val == null && def !== void 0) {
          return this.setData(key, def);
        }
        return val;
      }).catch(() => {
        if (def !== void 0) {
          return def;
        }
        throw new Error(`Failed to get data for key: ${key}`);
      });
    },
    setData(key, val) {
      return fetch(`/db/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(val)
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to set data for key: ${key}`);
        }
        return val;
      });
    },
    delData(key) {
      return fetch(`/db/${encodeURIComponent(key)}`, {
        method: "DELETE"
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to delete data for key: ${key}`);
        }
      });
    },
    listData() {
      return fetch(`/db`).then((res) => res.json()).catch(() => []);
    },
    clearData() {
      return fetch(`/db`, {
        method: "DELETE"
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to clear data");
        }
      });
    }
  };
  window.replit = replit;
})();
//# sourceMappingURL=helper.js.map
