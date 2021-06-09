/* This program was written by zuhail pm*/
/* for more details :www.github.com/zuhl-c*/


function viewImage(event) {
    document.getElementById('imgView').src = URL.createObjectURL(event.target.files[0])
}

$('#signup_admin').submit((event)=>{
    event.preventDefault()
    $.ajax({
      url:'/admin/signup',
      data: $('#signup_admin').serialize(),
      method:'post',
      success:function(response){
        if(response.status){
            location.href='/admin/'
        }
      }
    })
  })

function addTocart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'put',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1;
                $('#cart-count').html(count)
            } else {
                location.href = '/login'
            }
        }
    })
}

function changeQty(cartId, productId, count) {
    let quantity = parseInt(document.getElementById(productId).innerHTML)
    count = parseInt(count)
    $.ajax({
        url: '/change-product-qty',
        data: {
            cart: cartId,
            product: productId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.remove) {
                alert('product remove from cart?')
                location.reload()
            } else {
                document.getElementById(productId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.total
            }
        }
    })
}

function RemoveItem(cartId, productId) {
    $.ajax({
        url: '/remove-item',
        data: {
            cart: cartId,
            product: productId
        },
        method: 'post',
        success: (response) => {
            alert('Remove Item')
            location.reload()
        }
    })
}

$("#checkout-form").submit(function(e) {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            if (response.CODsuccess) {
                $('#success').modal('toggle')
            } else if (response.err) {
                $('#failed').modal('toggle')
            }
            else {
                //console.log(response)
                razorpayPayment(response)
            }
        }
    })
})

function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_key", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",//indian currency//
        "name": "Electronic Cart",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //order id for creating receipt//
        "handler": function (response) {
            //handler function creating signature and payment details and then verifing payment//
            verifyPayment(response, order)
        },
        "prefill": {
            "name": order.user.name,
            "email": order.user.email,
            "contact": order.user.phone
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#212529"
        },
        "modal": {
            "ondismiss": function () {
                //if user closed the payment window cancelling transaction//
                console.log('Checkout form closed');
                var closed = true;
                cancelTransfer(order, closed)
            }
        }
    }
    var rzp1 = new Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', function (response) {

        //payment failture codes //
        //if you are modifying  case, and send to response the error codes as a modal/alerts//

        // alert(response.error.code);
        // alert(response.error.description);
        // alert(response.error.source);
        // alert(response.error.step);
        // alert(response.error.reason);
        // alert(response.error.metadata.order_id);
        // alert(response.error.metadata.payment_id);

    })
}
function cancelTransfer(Data, closed) {
    if (closed) {
        $.ajax({
            url: '/cancel-transaction',
            data: Data,
            method: 'post',
            success: function (response) {
                //alert(response)
                $('#failed').modal('toggle')
            }
        })
    } else {
        console.log('not access')
    }
}


function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                //location.href='#order-success'
                $('#success').modal('toggle');
            } else {
                $('#failed').modal('toggle')
            }
        }
    })
}

function searchKey() {
    var keyword = document.getElementById('keyword').value;
    if (!keyword) {
        console.log('data is null')
        location.reload()
    } else {
        location.href = '/search/' + keyword;
    }
}


function update(width) {
    var TO = document.getElementById('TO-status')
    var elem = document.getElementById("status-bar");
    if (elem.style.width == 25 && width == 25) {
        width = 25;
        elem.style.width = width + "%";

    } else if (elem.style.width == "25%" && width == 25) {
        width = 50;
        elem.style.width = width + "%";
    } else if (elem.style.width == "50%" && width == 25) {
        width = 75;
        elem.style.width = width + "%";
    }
    else if (elem.style.width == "75%" && width == 25) {
        width = 100;
        elem.style.width = width + "%";
    }
    else {
        width = 25;
        elem.style.width = width + "%";
    }
}


function statusconfirm() {
    var value = document.getElementById('status-bar').style.width;
    var Id = document.getElementById('orderid').innerHTML;
    var user = document.getElementById('userid').innerHTML;
    $.ajax({
        url: '/admin/change-status',
        data: { id: Id, user: user, value: value },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.reload()
            }
        }
    })
}


$("#cancelReq").submit(function (e) {
    e.preventDefault()
    $.ajax({
        url: '/cancel-order',
        data: $('#cancelReq').serialize(),
        method: 'post',
        success: function (response) {
            if (response.status) {
                $('#cancel-req').modal('hide')
                $('#req_sended').modal('toggle')
                $('#req_btn').prop('disabled', true);
            } else {
                location.reload()
            }
        }
    })
})


function cancelOrder(id, user) {
    $.ajax({
        url: '/admin/cancel-order',
        data: {
            orderid: id,
            userid: user
        },
        method: 'post',
        success: function (response) {
            if (response.status) {
                $('#req_cancel').modal('hide')
                $('#res_success').modal('toggle')
            }
        }
    })
}

var prodcutID = null;
function DeleteProduct(data) {
    if (data) {
        $('#delete_product_confirm').modal('toggle')
        prodcutID = data;
    }
    else {
        prodcutID = null;
        console.log(prodcutID)
    }
}
function Confirm_delete() {
    console.log(prodcutID)
    $.ajax({
        url: '/admin/delete-product/' + prodcutID,
        method: 'delete',
        success: function () {
            window.location.reload()
        }
    })
}

function readInbox(data) {
    //console.log(data)
    $.ajax({
        url: '/read-message/' + data,
        method: 'put',
        success: function () {
            console.log('updated')
        }
    })
}