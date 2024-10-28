// click continue button and then show payment : Payment Page
document.addEventListener('DOMContentLoaded', function() {
    var continueButton = document.querySelector('.deliveryForm .button');
    var paymentForm = document.querySelector('.paymentForm');

    continueButton.addEventListener('click', function() {
        paymentForm.classList.add('show'); 
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var cardiganDiv = document.getElementById("cardiganDiv");
    cardiganDiv.addEventListener("click", function() {
        window.location.href = "/product/Cardigan"; 
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var cardiganDiv = document.getElementById("sweaterDiv");
    cardiganDiv.addEventListener("click", function() {
        window.location.href = "/product/Sweater"; 
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var cardiganDiv = document.getElementById("saleDiv");
    cardiganDiv.addEventListener("click", function() {
        window.location.href = "/product/SaleProduct"; 
    });
});