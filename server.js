var express = require('express');
var app = express();
var path = require('path');
var mongo = require('mongodb').MongoClient;

var mongoUrl = process.env.MONGOLAB_URI || "mongodb://localhost:27017/FreeCodeCamp";
var port = process.env.PORT || 3000;
var app_url = process.env.APP_URL || "https://urlshorten-hoanglong7421.heroku.com/";

mongo.connect(mongoUrl, function(err, db) {
	if (err) throw console.error(err);
	db.createCollection('urlShortener', {
		capped: true,
		size: 5242880,
		max: 5000
	});
	var urlShortener = db.collection('urlShortener');

	app.get('/', function(req, res) {
		res.sendFile(path.join(__dirname, 'index.html'));
	});

	app.get('/:id', function(req, res) {
		var id = Number(req.params.id);
		if(!Number.isNaN(id)) {
			urlShortener.find({
				"_id": id
			}).toArray(function(err, docs) {
				if (err) throw err;
				if(docs && docs.length) {
					res.redirect(docs[0]["origin_url"]);
				} else {
					res.end(JSON.stringify({'error': 'Shorten URL invalid'}));
				}				
			});
		} else {
			res.end(JSON.stringify({'error': 'Shorten URL invalid'}));
		}
	});

	app.get('/new/*?', function(req, res) {
		var url = req.params[0];
		var isValid = checkUrl(url);
		if (isValid) {
			urlShortener.find({
				"origin_url": url
			}).toArray(function(err, docs) {
				if (err) throw console.error(err);
				if(docs && docs.length) {
					console.log('Found', docs);
					res.end(JSON.stringify({
						"origin_url": url,
						"short_url": app_url + docs[0]["_id"]
					}));
				} else {
					var urlObj = {
						"_id": generateShortUrl(),
						"origin_url": url
					};
					urlShortener.save(urlObj, function(err, result) {
						if (err) throw err;
						res.end(JSON.stringify({
							"origin_url": url,
							"short_url": app_url + urlObj["_id"]
						}));
					});
				}
			});
		} else {
			res.end(JSON.stringify({'error' : 'URL invalid'}));
		}
	});

	app.listen(port, function() {
		console.log('server listen on port ' + port);
	});
})

function checkUrl(url) {
	var regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
	return regex.test(url);
}

function generateShortUrl(url) {
	var num = Math.floor(Math.random()*100000);
	return num;
}