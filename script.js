const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxXV6h2DfKjW0EqdYdsrCKMEIeqjtiHr8cgBt5GQYZK8L1Jtnsh2bKZIwtpGxWTIIZf/exec";

// User Management
async function login() {
    const userId = document.getElementById("number").value;
    const password = document.getElementById("passwd").value;
    
    try {
        const response = await fetch(`${SHEET_API_URL}?action=login&userId=${encodeURIComponent(userId)}&pass=${encodeURIComponent(password)}`);
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            window.location.href = "home.html";
        } else {
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Network error. Please try again.");
    }
}

async function createAccount() {
    const userId = document.getElementById("number").value;
    const password = document.getElementById("Pass").value;
    const confirmPass = document.getElementById("passs").value;
    
    if (!userId || !password) {
        alert("Please fill all fields");
        return;
    }
    
    if (password !== confirmPass) {
        alert("Passwords don't match");
        return;
    }

    try {
        console.log("Sending request..."); // Debug log
        const startTime = Date.now();
        
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "createUser",
                userId: userId,
                password: password
            })
        });
        
        console.log(`Request took ${Date.now() - startTime}ms`); // Timing
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data); // Debug log
        
        if (data.success) {
            localStorage.setItem("loggedUser", userId);
            window.location.href = "home.html";
        } else {
            alert(data.message || "Account creation failed");
        }
    } catch (error) {
        console.error("Full error:", error);
        alert(`Error: ${error.message}\nPlease check console for details`);
    }
}

// Book Management
async function getBooks() {
    try {
        const response = await fetch(`${SHEET_API_URL}?action=getBooks`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch books:", error);
        return [];
    }
}

async function addNewBook() {
    const name = document.getElementById("enterbookname").value;
    const price = document.getElementById("enterPrice").value;
    const img = document.getElementById("addphoto").value;
    const owner = localStorage.getItem("loggedUser");
    
    if (!owner) {
        alert("Please login first");
        return;
    }
    
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addBook",
                name,
                price,
                img,
                owner
            })
        });
        const data = await response.json();
        
        if (data.success) {
            displayBook(data.book);
            clearInputs();
            document.getElementById("createBook").style.display = "none";
        } else {
            alert(data.message || "Failed to add book");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to add book");
    }
}

async function deleteBook(bookId) {
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "deleteBook",
                bookId
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false };
    }
}