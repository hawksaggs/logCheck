const express = require('express');
const router = express.Router();
const path = require('path');
const request = require('request');
// const readline = require('readline');
const fs = require('fs');
const lineReader = require('line-reader');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/output', function (req, res) {
  var line_arr = [];
  var ext = path.extname(req.file.originalname).toLowerCase();
  var description = req.body.description;
  var counter = 0;
  var origin_pos = 0; // ORIGIN_HEADER position
  var client_ip_pos = 0; // CLIENT_IP position
  if (description.length > 0) {
    description = description.toLowerCase().split(" ");
    description.forEach(function (doc) {
      if (doc == 'origin_header') {
        origin_pos = counter;
      } else if (doc == 'client_ip:port') {
        client_ip_pos = counter;
      }
      counter = counter + 1;
    });
  } else {
    res.render('output', { "message": "Description field is empty", "success": false });
  }
  if (ext == '.txt') {

    lineReader.eachLine(req.file.path, function (line, last, cb) {
      var line_obj = {};
      if (line) {
        var line_split = line.split(" ");
        if (line_split[origin_pos].indexOf('.com') > -1) {
          var ip_regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
          var client_ip = line.match(ip_regex)[0];
          var url_request = 'http://ipinfo.io/' + client_ip;
          request(url_request, function (error, response, body) {
            if (response.statusCode == 200) {
              var output = JSON.parse(body);
              if (output.country != 'IN') {
                line_obj.status = 'Yes';
              } else {
                line_obj.status = 'No';
              }
              line_obj.line = line;
              line_arr.push(line_obj);
              if (last) {
                fs.unlink(req.file.path, function (err) {
                  if (err) {
                    return res.status(400).send({
                      error: true,
                      message: err.message
                    });
                  }
                  cb(false);
                  return res.render('output', { data: line_arr, success: true });
                });
              }
              cb();
            } else {
              cb();
            }
          });
        } else {
          line_obj.status = 'Yes';
          line_obj.line = line;
          line_arr.push(line_obj);
          if (last) {
            fs.unlink(req.file.path, function (err) {
              if (err) {
                return res.status(400).send({
                  error: true,
                  message: err.message
                });
              }
              cb(false);
              return res.render('output', { data: line_arr, success: true });
            });
          }
          cb();
        }
      } else {
        cb();
      }
    })
  } else {
    res.render('output', { "message": "Not valid extension", "success": false });
  }
});

module.exports = router;
