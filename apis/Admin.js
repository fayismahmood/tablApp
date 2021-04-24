const fs = require("fs");
const path = require("path");
var multer = require("multer");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");

var XLSX = require("xlsx");
var { convert, stox, xtos } = require("./convert");

var levelDb = require("./leveldb");
var createApi = require("./CreateApi");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "tabl");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

module.exports = (app) => {
  app.get("/api/Admin", (req, res) => {
    res.send("Adfadsf");
  });

  app.post("/tabl/all", (req, res) => {
    let _dirs = fs.readdirSync(path.join(__dirname, `../tabl/`));
    _dirs = _dirs.map((e) => {
      return e.replace(".json", "");
    });
    res.json(_dirs);
  });

  app.post("/tabl/sheetData", (req, res) => {
    let { id } = req.body;
    let Data = fs.readFile(
      path.join(__dirname, `../tabl/${id}.json`),
      "utf8",
      (err, data) => {
        if (err) {
          //console.log();
          if (err.code == "ENOENT") {
            res.json({ error: "no data found" });
          }
        } else {
          let _Data = JSON.parse(data);
          res.json(_Data);
        }
      }
    );
  });
  app.post("/tabl/sheetData/save", (req, res) => {
    let { id, data } = req.body;
    //let _data=xtos(data)
    //console.log(data);
    fs.writeFile(
      path.join(__dirname, `../tabl/${id}.json`),
      JSON.stringify(data),
      (err) => {
        if (err) {
          // console.log(err);
        } else {
          res.json({ info: "saved" });
        }
      }
    );
  });
  app.post("/tabl/sheetData/rename", (req, res) => {
    let { id, newId } = req.body;
    fs.rename(
      path.join(__dirname, `../tabl/${id}.json`),
      path.join(__dirname, `../tabl/${newId}.json`),
      (err) => {
        if (err) {
          // console.log(err);
        } else {
          levelDb.get(id, (err, val) => {
            let _v = val;
            levelDb.put(newId, val, (err) => {
              if (err) {
                return err;
              }
              levelDb.del(id, (err) => {
                if (err) {
                  res.json({ err });
                }
              });
            });
          });
          res.json({ id: newId });
        }
      }
    );
  });
  app.post("/tabl/sheetData/delete", (req, res) => {
    let { id } = req.body;
    fs.unlink(path.join(__dirname, `../tabl/${id}.json`), (err) => {
      if (err) {
        res.json({ error: err });
      } else {
        levelDb.del(id, (err) => {
          if (err) {
            res.json({ err });
          } else {
            res.json({ info: "deleted" });
          }
        });
      }
    });
  });

  app.post("/tabl/sheetData/new", (req, res) => {
    let _dirs = fs.readdirSync(path.join(__dirname, `../tabl/`));
    let nth = 0;
    function checkName() {
      let _name = "Untitled" + nth;
      let notFound = _dirs.find((e) => e == _name + ".json") == undefined;
      if (notFound) {
        return _name;
      }
      nth += 1;
      return checkName();
    }
    let _id = checkName();
    fs.writeFileSync(
      path.join(__dirname, `../tabl/${_id}.json`),
      JSON.stringify([{ name: "Sheet1" }])
    );
    levelDb.put(
      _id,
      JSON.stringify({ type: { type: "Public" }, headers: [] }),
      (err) => {
        if (err) res.json({ err });
        res.json({ id: _id });
      }
    );
  });

  app.get("/tablapi/:id", (req, res) => {
    //console.log(req.params, req.query);
    let { id } = req.params;
    let { hash } = req.query;

    levelDb.get(id, (err, val) => {
      if (err) {
        //console.log(err);
      } else {
        let _v = JSON.parse(val);
        //console.log(_v);
        if (_v.type.type == "Public") {
          //console.log(createApi(id, _v.headers));
          res.send(createApi(id, _v.headers));
        }
        if (_v.type.type == "HashedUrl") {
          if (hash) {
            jwt.verify(hash, _v.type.privateKey, (err, dec) => {
              if (err) {
                res.json({ err: "INVALID" });
                return err;
              }
              if (dec.id == id) {
                res.json(createApi(id, _v.headers));
              } else {
                res.json({ err: "INVALID" });
              }
            });
          } else {
            res.json({ err: "INVALID; Hash is not " });
          }
        }
      }
    });
  });

  app.post("/tabl/createapi", (req, res) => {
    let { id, type, headers } = req.body;
    levelDb.put(id, JSON.stringify({ type, headers }), function (err) {
      if (err) return console.log("Ooops!", err); // some kind of I/O erro
      let hash;
      if (type.type == "HashedUrl") {
        hash = jwt.sign({ id: id }, type.privateKey || "key");
      }
      res.json({ info: "success", hash });
    });
  });

  app.post("/tabl/getapi", (req, res) => {
    let { id } = req.body;
    levelDb.get(id, function (err, value) {
      if (err) return console.log("Ooops!", err); // likely the key was not fo
      let _v = JSON.parse(value);
      if (_v.type.type == "HashedUrl") {
        _v.hash = jwt.sign({ id: id }, _v.type.privateKey || "key");
      }
      res.json(_v);
    });
  });

  app.post("/tabl/upload", (req, res) => {
    var workbook = XLSX.read(req.body.data, { type: "binary" });
    workbook = stox(workbook);
    let _dir = fs.readdirSync(path.join(__dirname, `../tabl/`));
    if (_dir.find((e) => e == `${req.body.name}.json`) == undefined) {
      fs.writeFile(
        path.join(__dirname, `../tabl/${req.body.name}.json`),
        JSON.stringify(workbook),
        (err) => {
          if (err) {
            res.json({ err });
          }

          levelDb.put(
            req.body.name,
            JSON.stringify({ type: { type: "Public" }, headers: [] }),
            (err) => {
              if (err) res.json({ err });
            }
          );
        }
      );

      res.json({ id: req.body.name });
    } else {
      res.json({ error: "file Already Exist" });
    }
  });
};
