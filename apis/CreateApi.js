const fs = require("fs");
const path = require("path");

function createApi(id, headers) {
  let _data = JSON.parse(
    fs.readFileSync(path.join(__dirname, `../tabl/${id}.json`), "utf8")
  );
  console.log(_data);
  return QueryFy(_data, headers);
}

module.exports = createApi;

function Arrify(Obj) {
  let arr = [];
  Object.entries(Obj).forEach((e) => {
    arr[e[0]] = e[1];
  });
  return arr;
}

function QueryFy(data = [], headers = []) {
  console.log(data);
  return data.map((e) => {
    let rows = Arrify(e.rows).map((row) => {
      let _cells = Arrify(row.cells);
      let _cell = {};
      console.log(headers);
      headers.forEach((v, i) => {
        _cell[v] = _cells[i] ? (_cells[i].text ? _cells[i].text : "") : "";
      });
      return _cell;
    });
    return { name: e.name, rows: rows };
  });
}

//let wwe = QueryFy(wwww)[0]["rows"];
//wwe;
//let dddd = Arrify({ 0: 555, 1: 777 });
//dddd;
