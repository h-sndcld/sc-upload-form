var express    = require('express')
  , formidable = require('formidable')
  , fs         = require('fs')
  , path       = require('path')
  , uuid       = require('node-uuid');

var app = module.exports = express.createServer();
var uploads = {};

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

// Index form
app.get('/', function(req, res) {
  res.render('index', {uuid: uuid.v4()});
});

// Upload file
app.post('/upload/:uuid', function(req, res, next) {
  var request_uuid = req.param('uuid', uuid.v4());
  var form = new formidable.IncomingForm;

  form.uploadDir = __dirname + '/uploads';
  uploads[request_uuid] = {progress:0};

  form.parse(req, function(err, fields, files){
    if(err || !files.upload || files.upload.size == 0) return next(err);

    ['path', 'size', 'name', 'type'].forEach(function(field) {
      uploads[request_uuid][field] = files.upload[field];
    });

    var safe_name = encodeURIComponent(path.basename(files.upload.name));
    uploads[request_uuid].safe_name = safe_name;

    res.send("/files/"+request_uuid+"/"+safe_name);
  });

  form.on('progress', function(bytesReceived, bytesExpected) {
    uploads[request_uuid].progress = (100 * bytesReceived / bytesExpected) | 0;
  });
});

// Get upload progress
app.get('/progress/:uuid', function(req, res) {
  var request_uuid = req.param('uuid');
  var progress = uploads[request_uuid] && uploads[request_uuid].progress;

  res.json({progress:progress ? progress : 0});
});

// Update with title
app.post('/update/:uuid', function(req,res) {
  var request_uuid = req.param('uuid');
  if(!uploads[request_uuid]) return res.send('upload not found', 404);

  var form = new formidable.IncomingForm;
  form.parse(req, function(err, fields) {
    uploads[request_uuid].title = fields.title;
    res.render('view', {upload: uploads[request_uuid], uuid: request_uuid});
  });
});

// Stream file
app.get('/files/:uuid/:filename', function(req,res) {
  var request_uuid = req.param('uuid');
  if(!uploads[request_uuid]) return res.send('upload not found', 404);

  var reader = fs.createReadStream(uploads[request_uuid].path);
  res.contentType(uploads[request_uuid].type);
  reader.pipe(res);
})

// Only listen on $ node app.js
if (!module.parent) {
  var port = process.env.PORT || 80;
  app.listen(port, '0.0.0.0');
  console.log('Express server started on 0.0.0.0:' + port);
}
