var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Requiring our Note and Article models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

// Routes
// ======
module.exports = function(app) {

    // Simple index route
    app.get("/", function(req, res) {
    res.render("index",{});
    });

    // A GET request to scrape the echojs website
    app.get("/scrape", function(req, res) {
        console.log("David wants to read this!!!!");
    // First, we grab the body of the html with request
    request("http://www.nytimes.com/", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $("h2.story-heading").each(function(i, element) {

        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this).children("a").text();
        result.link = $(this).children("a").attr("href");

        // Using our Article model, create a new entry
        // This effectively passes the result object to the entry (and the title and link)
        var entry = new Article(result);

        

        // Now, save that entry to the db
        entry.save(function(err, doc) {
            // Log any errors
            if (err) {
            console.log(err);
            }
            // Or log the doc
            else {
            console.log(doc);
        }
        
        });

    }); //end for each
                    Article.find({}, function(error, results) {
                    // Log any errors
                    if (error) {
                    console.log(error);
                    }
                    // Or send the doc to the browser as a json object
                    else {
                        console.log("here")
                        console.log(results)
                    var hbsObject = {
                        articles: results
                    };
                    console.log(hbsObject);
                    res.render("index", hbsObject);
                    }
                });

    });
});

    // This will get the articles we scraped from the mongoDB
    app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, results) {
        // Log any errors
        if (error) {
        console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
         var hbsObject = {
            articles: results
        };
        console.log(hbsObject);
        res.render("index", hbsObject);
        }
    });
    });

    // Grab an article by it's ObjectId
    app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    // now, execute our query
    .exec(function(error, doc) {
        // Log any errors
        if (error) {
        console.log(error);
        }
        // Otherwise, send the doc to the browser as a json object
        else {
        res.json(doc);
        }
    });
    });


    // Create a new note or replace an existing note
    app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
        console.log(error);
        }
        // Otherwise
        else {
        // Use the article id to find and update it's note
        Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
        // Execute the above query
        .exec(function(err, doc) {
            // Log any errors
            if (err) {
            console.log(err);
            }
            else {
            // Or send the document to the browser
            res.send(doc);
            }
        });
        }
    });
    });
}