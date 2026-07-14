// Supabase Setup
const supabaseUrl = 'https://fzzwioyhmuanfvpotfit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6endpb3lobXVhbmZ2cG90Zml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDAxODYsImV4cCI6MjA5OTM3NjE4Nn0.y-eyWjY4oO8PbpiARC4RVy48256QUHfYn4BOZi2DdSQ'; 
let supabase;

// 1. कार्ट पेज को सुरक्षित तरीके से लोड करना
async function loadCartComponent() {
    try {
        const response = await fetch('cart.html?v=' + new Date().getTime()); // हमेशा नया डिज़ाइन लाएगा
        const html = await response.text();
        document.getElementById('cart-container').innerHTML = html;
        renderCart(); 
    } catch (error) {
        console.error("Cart page load error:", error);
    }
}

// 2. प्रोडक्ट लोड करना
async function loadProducts() {
    const container = document.getElementById('product-list');
    try {
        if (typeof window.supabase === 'undefined') throw new Error("Database link failed to load.");
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 font-bold">No products available.</div>';
            return;
        }

        container.innerHTML = '';
        data.forEach(product => {
            const card = `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
                    <div class="relative h-64 overflow-hidden bg-gray-50 flex justify-center items-center cursor-pointer rounded-t-xl" onclick="openImage('${product.image_url}')">
                        <img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                            <span class="text-white opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 px-4 py-1.5 rounded-full text-sm font-medium shadow-lg"><i class="ph ph-arrows-out-simple"></i> View</span>
                        </div>
                    </div>
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-2">${product.name}</h3>
                        <p class="text-xl font-extrabold text-gray-900 mb-4 mt-auto">₹${product.price}</p>
                        <button onclick="addToCart('${product.name}', ${product.price}, '${product.image_url}')" class="w-full peach-bg peach-hover text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2">
                            <i class="ph ph-shopping-bag-open text-xl"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        container.innerHTML = `<div class="col-span-full text-center text-red-600 font-bold py-10">Error loading products.</div>`;
    }
}

// 3. सारे कार्ट फीचर्स 
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer.classList.contains('translate-x-full')) {
        drawer.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        renderCart(); 
        document.body.style.overflow = 'hidden'; 
    } else {
        drawer.classList.add('translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto'; 
    }
}

function addToCart(name, price, image) {
    let cart = JSON.parse(localStorage.getItem('y_store_cart')) || [];
    let existing = cart.find(c => c.name === name);
    if(existing) existing.quantity += 1;
    else cart.push({ name: name, price: price, image: image, quantity: 1 });
    
    localStorage.setItem('y_store_cart', JSON.stringify(cart));
    if (document.getElementById('cart-drawer').classList.contains('translate-x-full')) toggleCart();
    else renderCart();
}

function renderCart() {
    let cart = JSON.parse(localStorage.getItem('y_store_cart')) || [];
    let cartItemsDiv = document.getElementById('cart-items');
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.getElementById('header-cart-count').innerText = totalItems;
    document.getElementById('cart-drawer-count').innerText = totalItems;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center py-24">
                <i class="ph ph-shopping-cart text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-bold text-gray-800">Your cart is empty</h3>
            </div>`;
        document.getElementById('checkout-section').style.display = 'none';
        document.getElementById('cross-sell').style.display = 'none';
        return;
    }

    document.getElementById('checkout-section').style.display = 'block';
    document.getElementById('cross-sell').style.display = 'block';
    cartItemsDiv.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        let itemTotal = Number(item.price) * item.quantity;
        total += itemTotal;
        cartItemsDiv.innerHTML += `
            <div class="flex items-start py-5 border-b border-gray-100 relative">
                <div class="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="ml-4 flex-1 pr-6">
                    <h3 class="text-sm font-bold text-gray-900 leading-tight mb-3">${item.name}</h3>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center border border-gray-300 rounded-sm bg-white">
                            <button onclick="updateQty(${index}, -1)" class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"><i class="ph ph-minus"></i></button>
                            <span class="w-8 h-7 flex items-center justify-center text-sm font-medium border-l border-r border-gray-300">${item.quantity}</span>
                            <button onclick="updateQty(${index}, 1)" class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"><i class="ph ph-plus"></i></button>
                        </div>
                        <span class="font-bold text-gray-900">₹ ${itemTotal}</span>
                    </div>
                </div>
                <button onclick="removeItem(${index})" class="absolute top-4 right-0 text-gray-400 hover:text-red-500 transition p-1">
                    <i class="ph ph-x font-bold text-lg"></i>
                </button>
            </div>
        `;
    });
    document.getElementById('subtotal').innerText = "₹ " + total;
    updateProgressBar(total);
}

function updateQty(index, delta) {
    let cart = JSON.parse(localStorage.getItem('y_store_cart')) || [];
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('y_store_cart', JSON.stringify(cart));
    renderCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('y_store_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('y_store_cart', JSON.stringify(cart));
    renderCart();
}

function updateProgressBar(total) {
    let msgElement = document.getElementById('discount-msg');
    let fillElement = document.getElementById('progress-fill');
    const tier1 = 1500;
    const tier2 = 2500;
    if (total < tier1) {
        msgElement.innerHTML = `Add ₹ ${tier1 - total} more Item and get extra 15% off`;
    } else if (total >= tier1 && total < tier2) {
        msgElement.innerHTML = `Add ₹ ${tier2 - total} more Item and get extra 25% off <span class="text-green-600 font-bold ml-1">(15% Unlocked!)</span>`;
    } else {
        msgElement.innerHTML = `<span class="text-green-600 font-bold">🎉 Congratulations! 25% OFF Unlocked!</span>`;
    }
    let percentage = (total / tier2) * 100;
    fillElement.style.width = (percentage > 100 ? 100 : percentage) + "%";
}

function openImage(imgUrl) {
    document.getElementById('fullImage').src = imgUrl;
    document.getElementById('imageModal').classList.remove('hidden');
}
function closeImage() {
    document.getElementById('imageModal').classList.add('hidden');
}
function checkout() { alert("Checkout Proceeding..."); }

// पेज लोड होते ही प्रोडक्ट और कार्ट दोनों मंगाना
window.onload = () => {
    loadProducts();
    loadCartComponent(); 
};
