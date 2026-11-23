const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'about.html':'text/html','flight.js':'text/javascript','simulation.html':'text/html','atlas.css':'text/css','atlas.js':'text/javascript','index.html':'text/html','style.css':'text/css','app.js':'text/javascript','planets.js':'text/javascript'};
for(const file of fs.readdirSync(path.join(__dirname,'assets'))){
 types['assets/'+file]=({'.js':'text/javascript','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'text/plain';
}
http.createServer((req,res) => {
  const file = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!Object.hasOwn(types,file)) {res.writeHead(404).end(); return;}
  fs.readFile(path.join(__dirname,file),(err,data) => {
    if(err){res.writeHead(500).end(); return;}
    res.writeHead(200,{'Content-Type':types[file]+'; charset=utf-8','Cache-Control':'no-store'}).end(data);
  });
}).listen(4174,'0.0.0.0',()=>console.log('Kinetic running at http://127.0.0.1:4174/'));
