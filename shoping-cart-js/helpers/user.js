/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { reject } = require('bcrypt/promises')
var objectId=require('mongodb').ObjectID;
const Razorpay =require('razorpay')
const date = require('date-and-time');
const Message = require('./messages');
const { response } = require('express');
var message = new Message()

var instance = new Razorpay({
    key_id: 'rzp_test_uWu157JMmfMDhI',
    key_secret: 'u4SJ2vhKNTU6cbNS6JEra6Pi',
  });

module.exports={
    doSignup:(userData)=>{
        console.log(userData)
        return new Promise(async(resolve)=>{
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
                }).then(()=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise((resolve)=>{
            //changing String to Int//
            count=parseInt(details.count)
            details.quantity=parseInt(details.quantity)

            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then(()=>{
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
        return new Promise((resolve)=>{
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
        return new Promise(async(resolve)=>{
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
        return new Promise((resolve)=>{
            //creating status
            if(order['payment-method']==='COD'){
                let ORDER={
                    deliveryAddress:order.address,
                    userId:objectId(order.userId),
                    paymentMethod:'cash on delivery',
                    products:products,
                    totalAmount:total,
                    status:'placed',
                    date:date.format(new Date(), 'DD-MM-YYYY hh:mm A')
                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(ORDER).then((response)=>{
                    db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId)}).then(() => {
                        console.log('cart items removed')
                    })
                    resolve(response.ops[0]._id)
                })

            }else{
                let ORDER={
                    deliveryAddress:order.address,
                    userId:objectId(order.userId),
                    paymentMethod:'online',
                    products:products,
                    totalAmount:total,
                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(ORDER).then((response)=>{
                    resolve(response.ops[0]._id)
                })     
            }  
        })
    },

    getCartlist:(userId)=>{
        return new Promise(async(resolve)=>{
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
        return new Promise(async(resolve)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).sort({date:-1}).toArray()
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
    generateRazorPay:(orderId,totalAmt)=>{
        return new Promise((resolve,reject)=>{
            var options = {  
            amount: totalAmt*100,  // amount in the smallest currency unit  
            currency: "INR",  
            receipt:''+orderId,
        }
            instance.orders.create(options, function(err, order){
                if(err){
                    console.log(err)
                    console.log('razrorpay order generation failed')
                    db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(orderId)}).then(()=>{
                        console.log('order removed')
                    })
                    reject(err)
                }else{
                    resolve(order)
                }
            })
        })
    },
    verifyPayment:(details,userId)=>{
        return new Promise(async(resolve,reject)=>{
            var receipt = details['order[receipt]']
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

                await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(receipt)},{$set:{'status':'placed',date:date.format(new Date(), 'DD-MM-YYYY hh:mm A')}})
                await db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(userId)})
                console.log('cart itmes removed ')
                resolve()

            }else{
                console.log('payment verification failed')
                db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(receipt)}).then(()=>{
                })
                reject('transaction cancelled')
            }
        })
    },
    async cancelRequest(data){
        let check =await db.get().collection(collection.INBOX).findOne({order:objectId(data.id)})
        if(check){
            console.log('already request recieved')
        }else{
            message.MakeCancelRequest(data.id,data.reason)
        }
    },
    getInbox(id){
        return new Promise((resolve)=>{
            db.get().collection(collection.USERINBOX).find({user:objectId(id)}).sort({time: -1}).toArray().then((inbox)=>{
                console.log(inbox)
                resolve(inbox)
            })
        })
    },
    cancelTransaction(data){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).removeOne({_id:objectId(data.receipt)}).then(()=>{
                resolve('transaction canceled')
            })
        })
    }
}
