// Simple error reporting without external dependencies
window.addEventListener("error", (e) => {
    fetch("/error", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            msg: e.error?.message || "Unknown error",
            stack: [{
                file: e.filename || "unknown",
                line: e.lineno || 0,
                col: e.colno || 0
            }]
        }),
    }).catch(() => {
        console.error("Failed to report error to server");
    });
});

interface User {
    id: string;
    name: string;
}

interface Replit {
    getUser(): Promise<User | null>;
    auth(): Promise<User | null>;
    getUserOrAuth(): Promise<User | null>;
    getData<D = any>(key: string, def?: D): Promise<D>;
    setData<D>(key: string, val: D): Promise<D>;
    delData(key: string): Promise<void>;
    listData(): Promise<string[]>;
    clearData(): Promise<void>;
}

// Enhanced Replit integration
const replit: Replit = {
    getUser(): Promise<User | null> {
        return fetch("/user")
            .then((res) => res.json())
            .then((user) => user || null)
            .catch(() => null);
    },

    auth(): Promise<User | null> {
        return new Promise((resolve) => {
            const authComplete = (e: MessageEvent) => {
                if (e.data !== "auth_complete") {
                    resolve(null);
                    return;
                }
                window.removeEventListener("message", authComplete);
                if (authWindow && !authWindow.closed) {
                    authWindow.close();
                }
                this.getUser().then(resolve);
            };

            window.addEventListener("message", authComplete);

            const w = 320;
            const h = 480;
            const left = (screen.width / 2) - (w / 2);
            const top = (screen.height / 2) - (h / 2);

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
            }, 30000);
        });
    },

    getUserOrAuth(): Promise<User | null> {
        return this.getUser().then((user) => {
            if (user) {
                return user;
            } else {
                return this.auth();
            }
        });
    },

    getData<D = any>(key: string, def?: D): Promise<D> {
        return fetch(`/db/${encodeURIComponent(key)}`)
            .then((res) => res.json())
            .then((val) => {
                if (val == null && def !== undefined) {
                    return this.setData(key, def);
                }
                return val;
            })
            .catch(() => {
                if (def !== undefined) {
                    return def;
                }
                throw new Error(`Failed to get data for key: ${key}`);
            });
    },

    setData<D>(key: string, val: D): Promise<D> {
        return fetch(`/db/${encodeURIComponent(key)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(val),
        }).then((res) => {
            if (!res.ok) {
                throw new Error(`Failed to set data for key: ${key}`);
            }
            return val;
        });
    },

    delData(key: string): Promise<void> {
        return fetch(`/db/${encodeURIComponent(key)}`, {
            method: "DELETE",
        }).then((res) => {
            if (!res.ok) {
                throw new Error(`Failed to delete data for key: ${key}`);
            }
        });
    },

    listData(): Promise<string[]> {
        return fetch(`/db`)
            .then((res) => res.json())
            .catch(() => []);
    },

    clearData(): Promise<void> {
        return fetch(`/db`, {
            method: "DELETE",
        }).then((res) => {
            if (!res.ok) {
                throw new Error("Failed to clear data");
            }
        });
    },
};

// Use type assertion to add replit to window
(window as any).replit = replit;
