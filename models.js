// export Schemas to web.js
module.exports.configureSchema = function(Schema, mongoose) {
    
    // Comment - is an embedded document for newsItem
    Comments = new Schema({
      name      : String
    , text      : String
    , date      : { type: Date, default: Date.now }
    });
    
    // newsItem - 
    var newsItem = new Schema({
      title     : String
    , urlslug   : String
    , content   : String
    , date      : { type: Date, default: Date.now }
    , comments  : [Comments]
    , author      : {
        name : String
        , email  : String
      }
    });


    

    // add schemas to Mongoose
    mongoose.model('newsItem', newsItem);
    mongoose.model('Comment', Comments);

};