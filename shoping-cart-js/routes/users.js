/* This program was written by zuhail pm*/
/* for more details :github/zuhl-c*/

//importing modules//
var express = require('express')
const session = require('express-session')
var router = express.Router()
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
var cartCount;

//function starting//
const verifyLogin=(req,res,next)=>{//login case checking function middleware
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
    console.log('user not found')
  }
}
// GET users home page. //
router.get('/', async function(req, res, next){
  let user=req.session.user;//creating user and assign session(userdata) after loggedin
  if(user){
    var userId=user._id;//after only passing id to client//
    cartCount=  await userHelpers.getCartCount(userId)
  }else{
    cartCount = null;
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render('users/index',{products,userId,cartCount})//sending user and products to view engine
  })
})
//product view//
router.get('/view-item/:id',(req,res)=>{
  //console.log(req.params.id)
  if(req.session.user){
    var userId=req.session.user._id;
  }
  productHelpers.viewItem(req.params.id).then((product)=>{
    res.render('users/view-item',{product,userId,cartCount})
  })
})
//search product//
router.get('/search/:data',async(req,res)=>{
  if(req.session.user){
    var userId=req.session.user._id;
  }
  productHelpers.searchItem(req.params.data).then((products)=>{
    //console.log(Items)
    res.render('users/index',{products,userId,cartCount})
  })
})
//Account//
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){//loggedin true then user redirect to home page
    res.redirect('/')
  }else{
    res.render('users/login',{'userErr':req.session.userErr,'pswrdErr':req.session.pswrdErr})
    req.session.userErr=false;
    req.session.pswrdErr=false;
  }
})
//login//
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{ //user data send to db and return data if the operations true
    if (response.status){
      req.session.loggedIn=true;//create session status
      req.session.user=response.user; //create session and assign response(userdata)//
      res.redirect('/')//going to home page after login
    }else{
      if(response.userErr){
        req.session.userErr="Invalid Username and Password";
        res.redirect('/login')
      }else if(response){
        req.session.pswrdErr="Inavlid Password";
        res.redirect('/login')
      }else{
        res.redirect('/login')
        console.log('checking done')
      }
    }
  })
})
//logout//
router.get('/logout',(req,res)=>{
  req.session.destroy();//deleting session after user loggedout(session and cookie live in 60s )
  console.log(session)
  res.redirect('/')
  console.log('logout')
})
//signin//
router.get('/signup',(req,res)=>{
  res.render('users/signup')
  userExist=false;
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{ // recieving userdata then send to database and return data
    if(response){
      if(response.ExistUser){
        let userExist="User already exit please login";
        res.render('users/signup',{userExist})
      }else{
        console.log('signup done')
        req.session.loggedIn=true;
        req.session.user=response;
        res.redirect('/')
      }
    }else{
      console.log('signup error')
      redirect('/signup')
    }
  })
})
//profile//
router.get('/profile' ,verifyLogin,async(req,res)=>{
  var userId=req.session.user._id;
  var user=await userHelpers.pickAddress(userId)
  //req.session.user=user;
  //console.log(user)
  res.render('users/user-profile',{userId,user,cartCount})

})

router.post('/edit-profile',verifyLogin,(req,res)=>{
  let profiledata=req.body;
  userHelpers.editUser(profiledata).then((response)=>{
    console.log(response)
    res.redirect('/profile')
  }).catch((err)=>{
    console.log(err)
    res.redirect('/profile')
  })
})
//adrress//
router.post('/add-address',verifyLogin,(req,res)=>{
  var userId=req.session.user._id;
  let address=req.body;
  userHelpers.addAddress(userId,address).then((response)=>{
    console.log(response)
    res.redirect('/profile')
  })
})
//cart//
router.get('/cart',verifyLogin,async(req,res)=>{
  var userId=req.session.user._id;
  let user=req.session.user;
  userHelpers.findCart(userId).then(async(response)=>{
      let products = await userHelpers.getCartProducts(userId)
      let total = await userHelpers.getTotalAmount(userId)
      res.render('users/cart',{products,user,userId,total,cartCount})

  }).catch((response)=>{
    res.render('users/cart',{userId,cartCount})
  })
})

router.get('/add-to-cart/:id',(req,res)=>{
  //sending productid and session-userid //
  var userId=req.session.user._id;
  console.log('ajax request recieved')
  if(req.session.user){
    userHelpers.addTocart(req.params.id,userId).then((response)=>{
      if(response){
        console.log('product added to cart')
        res.json({status:true})//response to ajax//
      }else{
        console.log('error to add cart')
  
      }
    })
  }else{
    console.log('user not found')
    res.json({status:false})
  }
})

router.post('/change-product-qty',(req,res,next)=>{
  console.log('request received')
  var userId=req.session.user._id;
  //console.log(req.body)
  userHelpers.changeProductQty(req.body).then(async(response)=>{
    if(response.RemoveItem){
      console.log('item removed')
      res.json({remove:true})
    }else{
      response.total= await userHelpers.getTotalAmount(userId)
      res.json(response)
    }
    //console.log(response)
  })

})

//place order//
router.post('/place-order',async(req,res)=>{
  let user=req.session.user;
  let userId=req.session.user._id;
  let products=await userHelpers.getCartlist(userId)
  let totalPrice= await userHelpers.getTotalAmount(userId)
  //console.log(products,totalPrice)
  let order=req.body;
  order.address=user.Address;
  order.userId=userId;
  //console.log(order)
  userHelpers.placeOrder(order,products,totalPrice).then((orderId)=>{
    console.log('order-created')
    if(req.body['payment-method']==='COD'){
      console.log('cash on delivery')
      res.json({CODsuccess:true})
    }else{
      userHelpers.generateRazorPay(orderId,totalPrice,userId).then((response)=>{
        res.json(response)
        console.log(response)
      }).catch((err)=>{
        res.json({err})
        console.log(err)
      })
    }
  })
})
//verify payment//
router.post('/verify-payment',(req,res)=>{
  //recieving razorpay order id,payment id,signature and order details,amount,currency,status,reciept//
  //passing this details to verifypayment //
  let userId =req.session.user._id;
  console.log(req.body)
  userHelpers.verifyPayment(req.body,userId).then(()=>{
    res.json({status:true})
    console.log('payment successfull')
  }).catch((err)=>{
    res.json({status:false})
    console.log('payment failed')
  })
})
//order//
// router.get('/order-success',verifyLogin,(req,res)=>{
//   var userId=req.session.user._id;
//   res.render('users/order-success',{userId,cartCount})
// })

router.get('/view-orders',verifyLogin,async(req,res)=>{
  var userId=req.session.user._id;
  let orders=await userHelpers.getOrders(userId)
  res.render('users/orders',{userId,orders,cartCount})
})

// router.get('/view-ordered-products/:id',verifyLogin,async(req,res)=>{
//   let orderedProducts= await userHelpers.getOrderedProducts(req.params.id)
//   res.render('users/view-ordered-products',{userId,orderedProducts,cartCount})

// })
router.post('/cancel-order',(req,res)=>{
  console.log(req.body)
  userHelpers.cancelRequest(req.body).then((response)=>{
    res.json({status:true})
  }).catch((err)=>{
    console.log(err)
    res.json({status:false})
  })
})

router.get('/inbox',verifyLogin,async(req,res)=>{
  let userId=req.session.user._id;
  let inbox= await userHelpers.getInbox(userId)
  res.render('users/inbox-user',{userId,cartCount,inbox})
})

module.exports = router;
