
function viewImage(event){
    document.getElementById('imgView').src=URL.createObjectURL(event.target.files[0])
}

function addTocart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1;
                $('#cart-count').html(count)
            }else{
                location.href='/login'
            }
        }
    })
}

function changeQty(cartId,productId,count){
    let quantity=parseInt(document.getElementById(productId).innerHTML)
    count=parseInt(count)
    $.ajax({
        url:'/change-product-qty',
        data:{
            cart:cartId,
            product:productId,
            count:count,
            quantity:quantity
        },
        method:'post',
        success:(response)=>{
            if(response.remove){
                alert('product remove from cart?')
                location.reload()
            } else {
                document.getElementById(productId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.total
            }
        }
    })
}

function RemoveItem(cartId,productId){
    $.ajax({
        url:'/remove-item',
        data:{
            cart:cartId,
            product:productId
        },
        method:'post',
        success:(response)=>{
            alert('Remove Item')
            location.reload()
        }
    })
}

$("#checkout-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(response)=>{
            if(response.CODsuccess){
                location.href="/order-success"
            }else{
                razorpayPayment(response)
            }
        }
    })
})

function razorpayPayment(order){
    var options = {
        "key": "rzp_test_uWu157JMmfMDhI", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "zuhail",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "zuhailpm",
            "email": "zuhailzed@gmail.com",
            "contact": "8086900574"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
    }
    function verifyPayment(payment,order){
        $.ajax({
            url:'/verify-payment',
            data:{
                payment,
                order
            },
            method:'post',
            success:(response)=>{
                if(response.status){
                    location.href='/order-success'
                }else{
                    location.href='/order-failed'
                }
            }
        })
    }

         function searchKey(){
             var keyword=document.getElementById('keyword').value;
             if(!keyword){
                 console.log('data is null')
                 location.reload()
             }else{
                location.href='/search/'+keyword;
             }
         }
         function update(width){
            var elem=document.getElementById("status-bar");
            if(elem.style.width==25&&width==25){
                width=25;
                elem.style.width=width+"%";
            }else if(elem.style.width=="25%"&&width==25){
                width=50;
                elem.style.width =width+"%";
            }else if(elem.style.width=="50%"&&width==25){
                width=75;
                elem.style.width=width+"%";
            }
            else if(elem.style.width=="75%"&&width==25){
                width=100;
                elem.style.width=width+"%";
            }
            else{
                width=25;
                elem.style.width=width+"%";
            }
        }
        function statusconfirm(){
            var value=document.getElementById('status-bar').style.width;
            var Id=document.getElementById('orderid').innerHTML;
            $.ajax({
                url:'/admin/change-status',
                data:{id:Id,value:value},
                method:'post',
                success:(response)=>{
                    if(response.status){
                        location.reload()
                    }
                }
            })
        }
            