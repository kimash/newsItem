var express = require('express'); 
var ejs = require('ejs'); //embedded javascript template engine

var app = express.createServer(express.logger());

var mongoose = require('mongoose'); // include Mongoose MongoDB library
var schema = mongoose.Schema; 

/************ DATABASE CONFIGURATION **********/
app.db = mongoose.connect(process.env.MONGOLAB_URI); //connect to the mongolabs database - local server uses .env file

// Include models.js - this file includes the database schema and defines the models used
require('./models').configureSchema(schema, mongoose);

// Define your DB Model variables
var newsItem = mongoose.model('newsItem');
var Comment = mongoose.model('Comment');
/************* END DATABASE CONFIGURATION *********/


/*********** SERVER CONFIGURATION *****************/
app.configure(function() {
    
    
    /*********************************************************************************
        Configure the template engine
        We will use EJS (Embedded JavaScript) https://github.com/visionmedia/ejs
        
        Using templates keeps your logic and code separate from your HTML.
        We will render the html templates as needed by passing in the necessary data.
    *********************************************************************************/

    app.set('view engine','ejs');  // use the EJS node module
    app.set('views',__dirname+ '/views'); // use /views as template directory
    app.set('view options',{layout:true}); // use /views/layout.html to manage your main header/footer wrapping template
    app.register('html',require('ejs')); //use .html files in /views

    /******************************************************************
        The /static folder will hold all css, js and image assets.
        These files are static meaning they will not be used by
        NodeJS directly. 
        
        In your html template you will reference these assets
        as yourdomain.heroku.com/img/cats.gif or yourdomain.heroku.com/js/script.js
    ******************************************************************/
    app.use(express.static(__dirname + '/static'));
    
    //parse any http form post
    app.use(express.bodyParser());
    
    /**** Turn on some debugging tools ****/
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

});
/*********** END SERVER CONFIGURATION *****************/



// main page - display all blog posts
// More Mongoose query information here - http://mongoosejs.com/docs/finding-documents.html
app.get('/', function(request, response) {

    // build the query
    var query = newsItem.find({});
    query.sort('date',-1); //sort by date in descending order
    
    // run the query and display blog_main.html template if successful
    query.exec({}, function(err, allPosts){
        
        // prepare template data
        templateData = {
            posts : allPosts	//holds everything returned by query
        };
        
        // render the card_form template with the data above
        response.render('blog_main.html', templateData);
        
    });
    
});
// end of main page


// Display a single blog post
app.get('/entry/:urlslug',function(request, response){
    
    // Get the request blog post by urlslug
    newsItem.findOne({ urlslug : request.params.urlslug },function(err, blogpost){
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
    });
});

// .findById example
// Get a blogpost by its unique objectId (._id)
app.get("/entryById/:postId", function(request, response) {
    
    var requestedPostID = request.params.postId;
    
    newsItem.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
        
    })
    
});


// add a comment to a blog post
app.post('/comment', function(request, response){
    
    // get the comment form's hidden value - urlslug
    var urlslug = request.body.urlslug;
    
    // Query for the blog post with matching urlslug
    newsItem.findOne({urlslug:urlslug}, function(err,post){
        // if there was an error...
        if (err) {
            console.log('There was an error');
            console.log(err);
            
            // display message to user
            response.send("uh oh, can't find that post"); 
        }
        
        // Prepare, save and redirect
        
        // prepare new comment for blog post with the form data
        var commentData = {
            name : request.body.name,
            text : request.body.text
        };
        
        // create new comment
        var comment = new Comment(commentData);
        
        // append the comment to the comment list
        post.comments.push(comment);
        post.save();
        
        // redirect to the blog entry
        response.redirect('/entry/' + urlslug);

    });
    
});




// CREATE A NEW BLOG POST

app.get('/new-entry',function(request, response){
    
    //display the blog post entry form
    response.render('blog_post_entry_form.html');
    
});

// receive a form submission
app.post('/new-entry', function(request, response){
    
    console.log('Received new blog post submission')
    console.log(request.body);
    
    // Prepare the blog post entry form into a data object
    var blogPostData = {
        title : request.body.title,
        location : request.body.location,
        urlslug : request.body.urlslug,
        refurl	: request.body.refurl,
        content : request.body.content,
        author : {
            name : request.body.name,
            email : request.body.email
        }
    };
    
    // create a new blog post
    var post = new newsItem(blogPostData);
    
    // save the blog post
    post.save();
    
    // redirect to show the single post
    response.redirect('/entry/' + blogPostData.urlslug); // for example /entry/this-is-a-post
    
});

app.get("/recent", function(request, response){
    
    // create date variable for 7 days ago
    var lastWeek = new Date();
    lastWeek.setDate(-7);
    
    // query for all blog posts where the date is greater than or equal to 7 days ago
    var query = newsItem.find({ date : { $gte: lastWeek }});

    query.sort('date',-1);
    query.exec(function (err, recentPosts) {

      
      // prepare template data
      templateData = {
          posts : recentPosts
      };
      
      // render the card_form template with the data above
      response.render('recent_posts.html', templateData);
      
    });
    
});

app.get("/entryById/:postId", function(request, response) {
    
    var requestedPostID = request.params.postId;
    
    newsItem.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
        
    })
    
});


app.get("/update/:postId", function(request, response){
    
    // get the request blog post id
    var requestedPostID = request.params.postId;
    
    // find the requested document
    newsItem.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {
            
            // prepare template data
            // blogpost data & updated (was this entry updated ?update=true)
            templateData = {
                blogpost : blogpost,
                updated : request.query.update
            };
            
            // found the blogpost
            response.render('blog_post_entry_update.html', templateData);
        }
        
    })
    
});

app.post("/update", function(request, response){
    
    // update post body should have form element called blog_post_id
    var postid = request.body.blog_post_id;

    // we are looking for the newsItem document where _id == postid
    var condition = { _id : postid };
    
    // update these fields with new values
    var updatedData = {
        title : request.body.title,
        location: request.body.location,
        refurl	: request.body.refurl,
        content : request.body.content,
        author : {
            name : request.body.name,
            email : request.body.email
        }
    };
    
    // we only want to update a single document
    var options = { multi : false };
    
    // Perform the document update
    // find the document with 'condition'
    // include data to update with 'updatedData'
    // extra options - this time we only want a single doc to update
    // after updating run the callback function - return err and numAffected
    newsItem.update( condition, updatedData, options, function(err, numAffected){
        
        if (err) {
            console.log('Update Error Occurred');
            response.send('Update Error Occurred ' + err);

        } else {
            
            console.log("update succeeded");
            console.log(numAffected + " document(s) updated");
            
            //redirect the user to the update page - append ?update=true to URL
            response.redirect('/update/' + postid + "?update=true");
            
        }
    });
    
});

// return all blog entries in json format
app.get('/data/allposts', function(request, response){

    // define the fields you want to include in your json data
    includeFields = ['title','content','location','urlslug','refurl','date','comments','author.name']

    // query for all blog
    queryConditions = {}; //empty conditions - return everything
    var query = newsItem.find( queryConditions, includeFields);

    query.sort('date',-1); //sort by most recent
    query.exec(function (err, newsItems) {

        // render the card_form template with the data above
        jsonData = {
          'status' : 'OK',
          'posts' : newsItems
        }

        response.json(jsonData);
    });
});

// Make server turn on and listen at defined PORT (or port 3000 if is not defined)
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});