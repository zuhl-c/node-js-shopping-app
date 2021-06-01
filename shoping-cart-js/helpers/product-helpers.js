/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectID;
const { resolve } = require('promise');
const { reject, promise } = require('bcrypt/promises');
const { response } = require('express');


module.exports={
    addProduct:(product)=>{
        product.price=parseInt(product.price)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
                resolve(data.ops[0]._id)
                console.log(data.ops[0]._id)
            })
        })
    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },

    deleteProduct:(productId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(productId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getProductDetails:(productId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateProduct:(productId,ProductBody)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $set:{
                    name:ProductBody.name,
                    catogary:ProductBody.catogary,
                    description:ProductBody.description,
                    //price:ProductBody.price,
                    price:parseInt(ProductBody.price)
    
    
                }

            }).then((response)=>{
                resolve(response)
            })
        })
    },
    searchItem:(data)=>{
        //console.log(data)
        // if(data != String){
        //     data=parseInt(data)
        //     console.log(data)
        // }
        return new Promise(async(resolve,reject)=>{
            let items= await  db.get().collection(collection.PRODUCT_COLLECTION).find( 
            {
                $and: [
                    { $or: [ { name: { $regex : data ,$exists: true } }, 
                             { catogary : { $regex: data ,$exists: true} }
                    ] }
                ]
            }
                //{ name: { $regex: data } 
            ).toArray()
            //console.log(items)
            resolve(items)
        })
    },
    viewItem:(itemId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(itemId)})
            .then((response)=>{
                resolve(response)
            })
        })
    }

    
}