const XLSX=require("xlsx")


let rowID=(str)=>{
    return str.match(/[0-9]+/)[0]-1
 }
 
 let cellID=(str)=>{
     let _i={A:0,B:1,C:2,D:3}
     return _i[str.match(/[A-Z | a-z]+/)[0]]
  }
  function CheckIfRow(str){
    return str.match(/\!/)==null
}

function convert(Obj){
    let _e=Object.entries(Obj)
    let _sheets=_e.map(_eachSheet=>{
        let SheetName=_eachSheet[0]
        let SheetValue=_eachSheet[1]
        let rows=[]

        let _rows=Object.entries(SheetValue).forEach(_eRow=>{
            let key=_eRow[0]
            let value=_eRow[1]
            
            if(CheckIfRow(key)){
                if(!rows[rowID(key)]){
                    rows[rowID(key)]=({cells:[]})
                }
                rows[rowID(key)].cells[cellID(key)]={text:value.v}
            }
        })
        
        return {name:SheetName,rows}
    })

    return _sheets
}


/////Sheetjs to xspreadsheet
function stox(wb) {
    var out = [];
    wb.SheetNames.forEach(function(name) {
      var o = {name:name, rows:{}};
      var ws = wb.Sheets[name];
      var aoa = XLSX.utils.sheet_to_json(ws, {raw: false, header:1});
      aoa.forEach(function(r, i) {
        var cells = {};
        r.forEach(function(c, j) { cells[j] = ({ text: c }); });
        o.rows[i] = { cells: cells };
      })
      out.push(o);
    });
    return out;
  }
  ///////Xspreadsheet to Sheetjs
  function xtos(sdata) {
    var out = XLSX.utils.book_new();
    sdata.forEach(function(xws) {
      var aoa = [[]];
      var rowobj = xws.rows;
      for(var ri = 0; ri < rowobj.len; ++ri) {
        var row = rowobj[ri];
        if(!row) continue;
        aoa[ri] = [];
        Object.keys(row.cells).forEach(function(k) {
          var idx = +k;
          if(isNaN(idx)) return;
          aoa[ri][idx] = row.cells[k].text;
        });
      }
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(out, ws, xws.name);
    });
    return out;
  }
  
exports.convert=convert
exports.stox=stox
exports.xtos=xtos