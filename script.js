// =================== CONFIG ===================
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxXV6h2DfKjW0EqdYdsrCKMEIeqjtiHr8cgBt5GQYZK8L1Jtnsh2bKZIwtpGxWTIIZf/exec";

// =================== AUTHENTICATION ===================
async function login() {
    const userId = document.getElementById("number").value.trim();
    const password = document.getElementById("passwd").value;

    if (!userId || !password) {
        alert("Please enter both phone number and password");
        return;
    }

    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", userId, password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            window.location.href = "home.html";
        } else {
            alert(data.message || "Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Network error. Please try again.");
    }
}

async function createAccount() {
    const userId = document.getElementById("number").value.trim();
    const password = document.getElementById("Pass").value;
    const confirmPass = document.getElementById("passs").value;

    if (!userId || !password || !confirmPass) {
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
            body: JSON.stringify({ action: "createUser", userId, password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            window.location.href = "home.html";
        } else {
            alert(data.message || "Account creation failed. User may already exist.");
        }
    } catch (error) {
        console.error("Account creation error:", error);
        alert("Account creation failed. Please try again.");
    }
}

// =================== BOOK OPERATIONS ===================
async function loadBooks() {
    try {
        const response = await fetch(`${SHEET_API_URL}?action=getBooks`);
        const books = await response.json();

        const container = document.getElementById("bookContainer");
        container.innerHTML = "";

        books.forEach(book => {
            const bookElement = document.createElement("div");
            bookElement.className = "book-card";
            bookElement.innerHTML = `
                <img src="${book.photoURL || 'default-book.jpg'}" alt="${book.bookName}" onerror="this.src='default-book.jpg'">
                <div class="book-info">
                    <h3>${book.bookName}</h3>
                    <p>Price: $${parseFloat(book.price).toFixed(2)}</p>
                    ${book.userId === localStorage.getItem("loggedUser") ? 
                        `<button onclick="deleteBook('${book.bookId}')">Delete</button>` : 
                        `<button onclick="contactSeller('${book.userId}')">Contact</button>`}
                </div>
            `;
            container.appendChild(bookElement);
        });
    } catch (error) {
        console.error("Error loading books:", error);
        alert("Failed to load books. Please refresh the page.");
    }
}

async function addNewBook() {
    const bookName = document.getElementById("bookNameInput").value.trim();
    const price = document.getElementById("bookPriceInput").value.trim();
    const photoURL = document.getElementById("addphoto").value.trim();

    if (!bookName || isNaN(price)) {
        alert("Please enter a valid book name and numeric price.");
        return;
    }

    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addBook",
                userId: localStorage.getItem("loggedUser"),
                bookName,
                price,
                photoURL
            })
        });

        const data = await response.json();

        if (data.success) {
            alert("Book added successfully!");
            loadBooks();
            document.getElementById("createBook").style.display = "none";
            clearBookForm();
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
                bookId,
                userId: localStorage.getItem("loggedUser")
            })
        });

        const data = await response.json();

        if (data.success) {
            alert("Book deleted successfully");
            loadBooks();
        } else {
            alert(data.message || "Failed to delete book");
        }
    } catch (error) {
        console.error("Error deleting book:", error);
        alert("Failed to delete book. Please try again.");
    }
}

// =================== HELPER FUNCTIONS ===================
function clearBookForm() {
    document.getElementById("bookNameInput").value = "";
    document.getElementById("bookPriceInput").value = "";
    document.getElementById("addphoto").value = "";
}

function toggleBookForm() {
    const form = document.getElementById("createBook");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

function contactSeller(userId) {
    alert(`Contact seller at: ${userId}`);
}

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("loggedUser")) {
        const userDisplay = document.getElementById("userDisplay");
        if (userDisplay) {
            userDisplay.textContent = localStorage.getItem("loggedUser");
        }
    }

    if (document.getElementById("bookContainer")) {
        loadBooks();
    }
});
