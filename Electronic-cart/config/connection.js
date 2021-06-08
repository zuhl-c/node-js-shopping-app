var mongoClient=require('mongodb').MongoClient
var state={db:null}

module.exports.connect=function(done){ 
    const url ='mongodb://localhost:27017'
    const dbname = 'shopping'


    mongoClient.connect(url,function(err,data){
        if (err) return done(err)
        state.db=data.db(dbname)
        done()

    })
   
}

module.exports.get=function(){
    return state.db
}