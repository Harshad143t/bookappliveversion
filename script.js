const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxXV6h2DfKjW0EqdYdsrCKMEIeqjtiHr8cgBt5GQYZK8L1Jtnsh2bKZIwtpGxWTIIZf/exec";

// ==================== USER MANAGEMENT ====================
async function login() {
    const userId = document.getElementById("number").value.trim();
    const password = document.getElementById("passwd").value.trim();
    
    // Validation
    if (!userId || !password) {
        alert("Please enter both phone number and password");
        return;
    }

    try {
        const response = await fetch(`${SHEET_API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "login",
                userId: userId,
                password: password
            })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            localStorage.setItem("userToken", data.token || ""); // If using tokens
            window.location.href = "home.html";
        } else {
            alert(data.message || "Invalid credentials");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(`Login failed: ${error.message}`);
    }
}

async function createAccount() {
    const userId = document.getElementById("number").value.trim();
    const password = document.getElementById("Pass").value;
    const confirmPass = document.getElementById("passs").value;

    // Validation
    if (!userId || !password) {
        alert("Please fill all fields");
        return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    
    if (password !== confirmPass) {
        alert("Passwords don't match");
        return;
    }

    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "createUser",
                userId: userId,
                password: password
            })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            alert("Account created successfully!");
            window.location.href = "home.html";
        } else {
            alert(data.message || "Account creation failed. Please try a different phone number.");
        }
    } catch (error) {
        console.error("Account creation error:", error);
        alert("Network error. Please check your connection and try again.");
    }
}

// ==================== BOOK MANAGEMENT ====================
async function getBooks(filter = "") {
    try {
        const response = await fetch(`${SHEET_API_URL}?action=getBooks&filter=${encodeURIComponent(filter)}`);
        if (!response.ok) throw new Error("Failed to fetch books");
        return await response.json();
    } catch (error) {
        console.error("Error fetching books:", error);
        alert("Failed to load books. Please refresh the page.");
        return [];
    }
}

async function addNewBook() {
    const name = document.getElementById("enterbookname").value.trim();
    const price = parseFloat(document.getElementById("enterPrice").value);
    const img = document.getElementById("addphoto").value.trim();
    const owner = localStorage.getItem("loggedUser");
    
    // Validation
    if (!owner) {
        alert("Please login first");
        return;
    }
    
    if (!name || isNaN(price)) {
        alert("Please enter valid book name and price");
        return;
    }
    
    if (price <= 0 || price > 1000) {
        alert("Price must be between 1 and 1000");
        return;
    }

    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addBook",
                name: name,
                price: price.toFixed(2),
                img: img || "default-book.jpg",
                owner: owner
            })
        });

        const data = await response.json();
        
        if (data.success) {
            displayBook(data.book);
            clearBookForm();
            toggleBookForm(false);
            alert("Book added successfully!");
        } else {
            alert(data.message || "Failed to add book");
        }
    } catch (error) {
        console.error("Error adding book:", error);
        alert("Failed to add book. Please try again.");
    }
}

async function deleteBook(bookId) {
    if (!confirm("Are you sure you want to delete this book?")) return;
    
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "deleteBook",
                bookId: bookId,
                userId: localStorage.getItem("loggedUser")
            })
        });

        const data = await response.json();
        
        if (data.success) {
            document.querySelector(`[data-id="${bookId}"]`).remove();
            alert("Book deleted successfully");
        } else {
            alert(data.message || "Failed to delete book");
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete book. Please try again.");
    }
}

// ==================== HELPER FUNCTIONS ====================
function clearBookForm() {
    document.getElementById("enterbookname").value = "";
    document.getElementById("enterPrice").value = "";
    document.getElementById("addphoto").value = "";
}

function toggleBookForm(show) {
    document.getElementById("createBook").style.display = show ? "flex" : "none";
}

function displayBook(book) {
    const bookElement = document.createElement("div");
    bookElement.className = "book";
    bookElement.setAttribute("data-id", book.id);
    bookElement.innerHTML = `
        <img src="${book.img}" alt="${book.name}" onerror="this.src='default-book.jpg'">
        <h3>${book.name}</h3>
        <p>Price: $${book.price}</p>
        ${book.owner === localStorage.getItem("loggedUser") ? 
            `<button class="delete-btn" onclick="deleteBook('${book.id}')">Delete</button>` : 
            `<button class="buy-btn">Contact Seller</button>`}
    `;
    document.getElementById("bookContainer").appendChild(bookElement);
}

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
    // Check login status
    const loggedUser = localStorage.getItem("loggedUser");
    if (loggedUser) {
        document.getElementById("userDisplay").textContent = loggedUser;
    }

    // Load books
    if (document.getElementById("bookContainer")) {
        const books = await getBooks();
        books.forEach(book => displayBook(book));
    }

    // Setup event listeners
    document.getElementById("searchBtn")?.addEventListener("click", async () => {
        const searchTerm = document.getElementById("searchBook").value;
        const books = await getBooks(searchTerm);
        document.getElementById("bookContainer").innerHTML = "";
        books.forEach(book => displayBook(book));
    });
});
