const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3002", 10);
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error handling", req.url, err);
            res.statusCode = 500;
            res.end("Internal server error");
        }
    }).listen(port, hostname, () => {
        console.log(`> NP Label ready on http://${hostname}:${port}`);
    });
});
