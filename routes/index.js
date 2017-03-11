var express = require('express');
var rbxJs = require('roblox-js');
var https = require('https');
var router = express.Router();

var apiKey = "1IJBk5TxgeUSHd3NPtBoiN9LbaxMuXi1QkoCLz8HtsyN8O4wng2cP0Ftfp6Z";
var bumpedPosts = {};
var username;
var password;

function GenerateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i = 0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function BumpPost(postId, interval, bumpMessage) {
	if (bumpedPosts[postId.toString()]) 
		return;

	console.log("Logging into Bot...");
	console.log("user: " + username + ", password: " + password);

	rbxJs.login({username, password}).then(function(info) {
	    console.log('Permissions Accessed');

	    function perpetuate() {
	    	if (!bumpedPosts[postId.toString()])
	    		return;

	    	console.log('Bumping Post #' + postId);

	    	rbxJs.forumPost({
	    		"postId": postId,
	    		"body": bumpMessage + " " + GenerateRandomString()
	    	}).then(function(postId) {
	    		console.log("Successfully Bumped Post #" + postId);
	    		setTimeout(perpetuate, interval * 1000);
	    	}).catch(function(err) {
	    		console.log("ERROR: " + err);
	    		
	    		if (err.toString().indexOf("Error: Floodcheck blocked post") == -1)
	    			bumpedPosts[postId.toString()] = undefined;
	    		else
	    			perpetuate();
	    	});
	    };

	    bumpedPosts[postId.toString()] = true;
		perpetuate();
	}).catch(function(err) {
		console.log('Permissions Denied');
		console.log(err);
	});
}

router.get('/BumpedPosts', function(req, res) {
	if (req.query.apiKey == apiKey) {
		res.send(JSON.stringify({
			RequestCompleted: true,
			Posts: Object.keys(bumpedPosts).filter(function(Id) {
				return bumpedPosts[Id];
			})
		}));
	} else {
		console.log(req.query.apiKey);
		res.send(JSON.stringify({
			RequestCompleted: false,
			Error: "INCORRECT_API_KEY"
		}));
	}
});

router.get('/BumpPost', function(req, res) {
	if (req.query.apiKey == apiKey) {
		username = req.query.username;
		password = req.query.password;

		BumpPost(
			req.query.postId, 
			req.query.interval, 
			decodeURI(req.query.bumpMessage)
		);

		res.send("Request Received");
	} else {
		console.log(req.query.apiKey);
		res.send(JSON.stringify({
			RequestCompleted: false,
			Error: "INCORRECT_API_KEY"
		}));
	}
});

router.get('/EndPost', function(req, res) {
	if (req.query.apiKey == apiKey) {
		var endInterval = bumpedPosts[req.query.postId];

		if (endInterval) {
			bumpedPosts[req.query.postId] = undefined;
			res.send("Post Deleted");
		} else {
			res.send("Post Not Found");
		}
	} else {
		console.log(req.query.apiKey);
		res.send(JSON.stringify({
			RequestCompleted: false,
			Error: "INCORRECT_API_KEY"
		}));
	}
})

console.log("Setup Complete.");

module.exports = router;
