#!/usr/bin/env node
'use strict';
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const os = require('os');
const util = require('util');
const server = http.createServer(function(req, res) {
  if (req.url == '/fileupload') {
    console.time('Duration');
    const form = formidable({multiples: true, maxFileSize: 5*1024*1024*1024});
    form.parse(req, function(err, fields, files) {
      if (err) throw err;
      if (!Array.isArray(files.filetoupload)) {
        files.filetoupload = [files.filetoupload];
      }
      if (files.filetoupload.length == 0) {
        console.log('No File Selected!');
        console.timeEnd('Duration');
        res.write('Empty File Selected!');
        return res.end();
      }
      const move = util.promisify(fs.rename);
      const filesdata = [];
      const movepromises = [];
      for (const file of files.filetoupload) {
        const oldpath = file.path;
        const newpath = '/home/umar1503/mobile/' + file.name;
        movepromises.push(
            move(oldpath, newpath).then((err) => {
              if (err) throw err;
              const stats = fs.statSync(newpath);
              filesdata.push({name: file.name, size: (stats.size / (1024 * 1024)).toFixed(2) + 'MB'});
            }),
        );
      }
      Promise.all(movepromises)
          .then(() => {
            console.table(filesdata);
            console.timeEnd('Duration');
            res.write('Files uploaded and moved!');
            res.end();
          })
          .catch((err) => {
            console.log(err);
            console.table(filesdata);
            console.timeEnd('Duration');
            res.write('Files could not be moved!');
            res.end();
          });
    });
  } else {
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload" directory multiple><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  }
});
server.listen(8080, () => {
  console.log('Listening on : ' + getIP() + ':8080');
});

function getIP() {
  const iface = os.networkInterfaces();
  const intarray = [];
  for (const key in iface) {
    if (iface.hasOwnProperty(key)) {
      const element = iface[key];
      intarray.push(...element);
    }
  }
  const lip = intarray.find((myinterface) => myinterface.internal == false && myinterface.family == 'IPv4');
  return lip.address;
}
