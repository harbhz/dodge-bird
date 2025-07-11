// kaboom dev server with latest features

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const express = require("express");
const ws = require("ws");
const http = require("http");
const Database = require("@replit/database");
const multiplayer = require("./multiplayer");
const db = new Database();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;
let err = null;

// start multiplayer server
multiplayer(server);

// build user game
function buildGame() {
    const template = fs.readFileSync("template.html", "utf-8");
    let code = "";

    code += `<script src="/dist/helper.js"></script>\n`;
    code += `<script src="/dist/game.js"></script>\n`;

    try {
        // build user code with modern esbuild options
        esbuild.buildSync({
            bundle: true,
            sourcemap: true,
            target: "es2020",
            keepNames: true,
            logLevel: "silent",
            entryPoints: ["code/main.js"],
            outfile: "dist/game.js",
            format: "iife",
            globalName: "game"
        });

        esbuild.buildSync({
            bundle: true,
            sourcemap: true,
            target: "es2020",
            keepNames: true,
            entryPoints: ["helper.ts"],
            outfile: "dist/helper.js",
            format: "iife"
        });

    } catch (e) {
        const loc = e.errors[0].location;
        err = {
            msg: e.errors[0].text,
            stack: [
                {
                    line: loc.line,
                    col: loc.column,
                    file: loc.file,
                },
            ],
        };
        let msg = "";
        msg += "<pre style='color: red; font-family: monospace; padding: 20px;'>";
        msg += `ERROR: ${err.msg}\n`;
        if (err.stack) {
            err.stack.forEach((trace) => {
                msg += `    -> ${trace.file}:${trace.line}:${trace.col}\n`;
            });
        }
        msg += "</pre>";
        fs.writeFileSync("dist/index.html", msg);
        return;
    }

    fs.writeFileSync("dist/index.html", template.replace("{{kaboom}}", code));
}

// server middleware
app.use(express.json({ strict: false }));
app.use(express.static(__dirname));

// routes
app.get("/", (req, res) => {
    err = null;
    buildGame();
    res.sendFile(__dirname + "/dist/index.html");
    render();
});

app.post("/error", (req, res) => {
    err = req.body;
    render();
    res.sendStatus(200);
});

app.get("/user", (req, res) => {
    if (req.headers["x-replit-user-id"]) {
        res.json({
            id: req.headers["x-replit-user-id"] || null,
            name: req.headers["x-replit-user-name"] || null,
        });
    } else {
        res.json(null);
    }
});

// Database routes
app.get("/db", async (req, res) => {
    try {
        res.json(await db.list());
    } catch (e) {
        res.sendStatus(500);
    }
});

app.delete("/db", async (req, res) => {
    try {
        await db.empty();
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.get("/db/:item", async (req, res) => {
    try {
        res.json(await db.get(req.params.item));
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post("/db/:item", async (req, res) => {
    try {
        await db.set(req.params.item, req.body);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.delete("/db/:item", async (req, res) => {
    try {
        await db.delete(req.params.item);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    render();
});

// terminal output
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const dim = (msg) => `\x1b[2m${msg}\x1b[0m`;

function render() {
    // clear terminal
    process.stdout.write("\x1b[2J");
    process.stdout.write("\x1b[H");
    
    console.log(green("🎮 DODGE BIRD"));
    console.log(dim(`Server: http://localhost:${port}`));
    console.log(dim("(tip: Cmd + S in editor to refresh webview)\n"));

    // error stack trace
    if (err) {
        console.log("");
        console.error(red(`ERROR: ${err.msg}`));
        if (err.stack) {
            err.stack.forEach((trace) => {
                console.error(`    -> ${trace.file}:${trace.line}:${trace.col}`);
            });
        }
    }
}
