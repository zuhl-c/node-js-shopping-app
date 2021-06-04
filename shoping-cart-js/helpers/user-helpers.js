/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { reject, promise } = require('bcrypt/promises')
const { resolve } = require('promise')
const { response } = require('express')
var objectId=require('mongodb').ObjectID;
const productHelpers = require('./product-helpers')
const Razorpay =require('razorpay')
const date = require('date-and-time');
var instance = new Razorpay({
    key_id: 'rzp_test_uWu157JMmfMDhI',
    key_secret: 'u4SJ2vhKNTU6cbNS6JEra6Pi',
  });

module.exports={
    doSignup:(userData)=>{
        console.log(userData)
        return new Promise(async(resolve,reject)=>{
            let checkEmail= await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})//checking email already have user//
            let checkPhone= await db.get().collection(collection.USER_COLLECTION).findOne({phone:userData.phone})//checking phone already have user//
            if(checkEmail||checkPhone){
                console.log('user exists')
                resolve({ExistUser:true})
            }else{
                console.log("New User")
                userData.phone = parseInt(userData.phone)
                userData.password= await bcrypt.hash(userData.password,10)//user password encrypt
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                    db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(data.ops[0]._id)},{projection:{password:0}}).then((response)=>{
                        console.log(response)
                        resolve(response)
                    })
                })
            }
        })
    },

    editUser:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let userId=userData.userId;
            userData.phone=parseInt(userData.phone)
            let User= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})

            if(userData.name==User.name&&userData.email==User.email&&userData.phone==User.phone){
                reject('No changes found')
            }else{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                    $set:{
                        name:userData.name,
                        email:userData.email,
                        phone:userData.phone
                    }
                }).then((response)=>{
                    resolve('profile updated')

                }).catch((err)=>{
                    console.log('profile updation failed')
                    reject(err)
                })
            }

        })

    },
    
    addAddress:(userId,address)=>{
        // creating address // updating
        return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{

                    $set:{
                        Address:{

                            fullname:address.name,
                            phone:parseInt(address.phone),
                            pincode:parseInt(address.pincode),
                            state:address.state,
                            city:address.city,
                            area:address.area,
                            landmark:address.landmark

                        }
                    }
                }).then(()=>{
                    resolve('address updated')
                })            
           
        })
    },

    pickAddress:(userId)=>{
        console.log(userId)
        return new Promise(async(resolve,reject)=>{
           db.get().collection(collection.USER_COLLECTION).findOne(
               {
                   _id: objectId(userId)
               },
               {
                   projection:{password:0}
               }
           ).then((data)=>{
               console.log(data)
               resolve(data)
           })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let status={};
            let response={};//creating response variable
            var user =await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})//finding user
            if (user){//user data
                console.log('user found')
                bcrypt.compare(userData.password,user.password).then((status)=>{//checking password
                    if(status){//true
                        console.log('login done')
                        //user data assign to response user//
                        response.status=true;//creating status
                        db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(user._id)},{projection:{password:0}}).then((data)=>{
                            response.user=data;
                            console.log(data)
                            resolve(response)//send response(userdata,status)//
                        })
                    }else{
                        response.pswdErr=true;
                        resolve(response)//password wrong
                        console.log('password incorrect')
                    }
                })
            }else{
                status.userErr=true;
                resolve(status)//no user email
                console.log('user not found')
            }
        })
    },

    addTocart:(productId,userId)=>{
        let cartProduct={
            item:objectId(productId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            //checking user have cart
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                //checking quantity of product, already in cart//
                let productExist= userCart.products.findIndex(product=> product.item==productId)
                console.log(productExist);
                //already product in cart, updating quantity
                if (productExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({user:objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((response)=>{
                          
                            resolve(response)
                        })
                } else {
                    //product not in cart ,add new item
                    // then update product array//
                    db.get().collection(collection.CART_COLLECTION).
                    updateOne({user: objectId(userId)},
                        {
                            $push: { products : cartProduct}
                        }
                    ).then((response) => {
                        resolve(response)
                    })
                }
               
            }else{
                // user have no cart in db collection then creating cart for user// 
                let Cart={
                    user:objectId(userId),//user id 
                    products:[cartProduct]//product id and quantity
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(Cart).then((response)=>{
                    resolve(response)
                    console.log('usercart created')
                })
            }
        })
    },
    findCart:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(!cart||cart.products[0]==null){
                console.log("cart empty")
                reject()
            }else{
                resolve()
                console.log("cart found")
            }
        })

    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
            console.log(cartItems)
            
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
               var count=cart.products.length;
            }else{
                count=0;
            }
            
            resolve(count)
        })
    },
    changeProductQty:(details)=>{
        console.log(details)
        if(details.count==-1){
            console.log('quantity decerement')
        }
        else{
            console.log('quantity increment')
        }
        return new Promise((resolve,reject)=>{
            //changing String to Int//
            count=parseInt(details.count)
            details.quantity=parseInt(details.quantity)

            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({RemoveItem:true})
                })
                
            }else{
                db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart), 'products.item': objectId(details.product) },
                {
                    $inc: { 'products.$.quantity': count }
                }
            ).then((response)=>{
                //console.log(response)
                resolve(response)
            })
            }
            
        })
    },
    removeCartItem:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({response})
            })
        })
       
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        }).catch((err)=>{
            reject(err)
        })
    },
    
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            //creating status
            let status=order['payment-method']==='COD'?'placed':'pending'
            let Order={
                deliveryAddress:order.address,
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                date:date.format(new Date(), 'DD-MM-YYYY hh:mm A'),
                status:status
            }
            console.log(Order)
            db.get().collection(collection.ORDER_COLLECTION).insertOne(Order).then((response)=>{
                //removing cart of ordered item
                if(order['payment-method']==='COD'){
                    db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)}).then(()=>{
                        console.log('cart removed of orderd items -COD')
                    })
                }
                //console.log(response.ops[0]._id)
                resolve(response.ops[0]._id)
            })
        })
    },

    getCartlist:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).aggregate(
            {
                $match:{user:objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{_id:0,item:'$products.item',quantity:'$products.quantity'}
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'

                },

            },
            {
                $unwind: '$product'
            },
            {
                $project:{product:1}
            }
            ).toArray()
            console.log(cart)
            resolve(cart)
            
        })
    },
    getOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
            console.log(orders)
        })
    },
    // getOrderedProducts(orderId){
    //     return new Promise(async(resolve,reject)=>{
    //         let orderedProducts=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
    //             {
    //                 $match:{_id:objectId(orderId)}
    //             },
    //             {
    //                 $unwind:'$products'
    //             },
    //             {
    //                 $project:{
    //                     item:'$products.item',
    //                     quantity:'$products.quantity'
    //                 }
    //             },
    //             {
    //                 $lookup:{
    //                     from:collection.PRODUCT_COLLECTION,
    //                     localField:'item',
    //                     foreignField:'_id',
    //                     as:'product'
    //                 }
    //             },
    //             {
    //                 $project:{
    //                     item:1,
    //                     quantity:1,
    //                     product:{$arrayElemAt:['$product',0]}
    //                 }
    //             }
    //         ]).toArray()
    //         console.log(orderedProducts)
    //         resolve(orderedProducts)
    //     })

    // },
    generateRazorPay:(orderId,totalAmt,userId)=>{
        return new Promise((resolve,reject)=>{
            var options = {  
            amount: totalAmt*100,  // amount in the smallest currency unit  
            currency: "INR",  
            receipt:''+orderId,
        }
            instance.orders.create(options, function(err, order){
                if(err){
                    console.log('razrorpay order generation failed')
                    db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(orderId)}).then(()=>{
                        console.log('order removed')
                    })
                    reject(err)
                }else{
                    console.log('razorpay order generation successfull')
                    db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(userId)}).then(()=>{
                        console.log('cart removed of orderd items -ONLINE')
                    })
                    resolve(order)
                }
            })
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto')
            //creating hmac hash key using razorpay secret key //
            let hmac = crypto.createHmac('sha256','u4SJ2vhKNTU6cbNS6JEra6Pi')
            console.log(hmac)
            //push this order-data to hmac //
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            // creating signature //
            hmac=hmac.digest('hex')
            // checking recieved signature parameter equal to created hmac signature //
            if(hmac==details['payment[razorpay_signature]']){
                console.log('created signature: '+hmac)
                console.log('received signature: '+details['payment[razorpay_signature]'])
                console.log('payment verified')
                let receipt = details['order[receipt]']
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(receipt)},{$set:{'status':'placed'}})
                resolve()  
            }else{
                console.log('payment verification failed')
                reject()
            }
        })
    },
    async cancelRequest(data){
        let alert ={
            type:"cancel-request",
            orderid:data.id,
            reason:data.reason,
            time:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
        }
        let check =await db.get().collection(collection.ALERTS).findOne({orderid:data.id})
        if(check){
            console.log('already request recieved')
        }else{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.ALERTS).insertOne(alert,function(err,data){
                    if(data){
                        resolve('cancellation request success')
                    }else{
                        reject('cancellation request failed')
                    }
                })
            })
            
        }
    }
}
