const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const fs = require("fs");

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

let apis = require("./apis")(app);

const resolve = (p) => path.resolve(__dirname, p);

// async function d() {
//   let root = process.cwd();
//   vite = await require("vite").createServer({
//     root,
//     logLevel: "info",
//     server: {
//       middlewareMode: true,
//     },
//   });

//   app.use(vite.middlewares);

//   app.use("*", async (req, res) => {
//     const url = req.originalUrl;
//     template = fs.readFileSync(resolve("index.html"), "utf-8");
//     template = await vite.transformIndexHtml(url, template);
//     res.send(template);
//   });
// }

//d();
app.use("/assets", express.static("dist"));

app.use("*", (req, res) => {
  template = fs.readFileSync(resolve("index.html"), "utf-8");
  res.send(template);
});
app.listen(3800);
