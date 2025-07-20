const auth = firebase.auth();
const db = firebase.database();

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded fired");

  // Profile button setup
  const profileBtn = document.getElementById("profile");
  if (profileBtn) {
    const user = auth.currentUser;
    if (user) {
      document.getElementById("loggeduser").innerText = `User: ${user.email}`;
      profileBtn.innerText = "Log out";
      profileBtn.onclick = function () {
        if (confirm("Are you sure you want to log out?")) {
          logOut();
        }
      };
    } else {
      profileBtn.innerText = "Log in";
      profileBtn.onclick = logInbtn;
    }
    loadBooks();
  }

  // Ensure submitBook event listener is attached
  const submitBookBtn = document.getElementById("submitBook");
  if (submitBookBtn) {
    console.log("Attaching event listener to submitBook button");
    submitBookBtn.addEventListener("click", addNewBook);
  } else {
    console.error("submitBook button not found in DOM");
  }
});

function loadBooks(searchTerm = '') {
  console.log("Loading books with search term:", searchTerm);
  const booksRef = db.ref('books/');
  booksRef.on('value', (snapshot) => {
    const container = document.getElementById("container");
    if (!container) {
      console.error("Container element not found");
      return;
    }
    container.innerHTML = "";
    if (!snapshot.exists()) {
      console.log("No books found in database");
      container.innerHTML = "<p>No books available.</p>";
      return;
    }
    snapshot.forEach(childSnapshot => {
      const book = childSnapshot.val();
      book.id = childSnapshot.key;
      if (!searchTerm || book.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        displayBook(book);
      }
    });
    console.log("Books loaded:", snapshot.val());
  }, (error) => {
    console.error("Error loading books:", error);
    alert("Failed to load books: " + error.message);
  });
}

function displayBook(book) {
  console.log("Displaying book:", book);
  const newBook = document.createElement("div");
  newBook.className = "books";
  newBook.setAttribute("data-id", book.id);

  newBook.innerHTML = `
    <div class="bookImg">
      <img src="${book.img || 'https://via.placeholder.com/150'}" alt="book image">
      <button class="bookDelBtn">Remove</button>
    </div>
    <div class="bookInfo">
      <p class="bookname">Book name: ${book.name}</p>
      <hr id="bookname">
      <p class="price">Price: <span class="Price">${book.price}</span> RS</p>
      <hr id="prc">
      <p class="timestamp">Posted on: ${book.time || 'unknown'}</p>
      <button class="buyBtn" onclick = "buyBook()">Buy now</button>
    </div>`;

  const container = document.getElementById("container");
  if (container) container.prepend(newBook);

  const currentUser = auth.currentUser;
  const deleteBtn = newBook.querySelector(".bookDelBtn");

  if (currentUser && book.owner === currentUser.uid) {
    deleteBtn.style.display = "flex";
    deleteBtn.addEventListener("click", () => removeBook(book.id));
  } else {
    deleteBtn.style.display = "none";
  }

  newBook.querySelector(".buyBtn").addEventListener("click", () => {
    buyBook(book.owner, book.name, book.price, book.img);
  });
}

function logInbtn() {
  window.location.href = "index.html";
}

function logOut() {
  auth.signOut().then(() => {
    localStorage.removeItem("loggedUser");
    alert("Logged out successfully!");
    window.location.href = "index.html";
  }).catch((error) => {
    alert("Logout failed: " + error.message);
  });
}

function login(event) {
  event.preventDefault();
  const email = document.getElementById("number").value.trim() + "@bookmart.com";
  const password = document.getElementById("passwd").value.trim();

  auth.signInWithEmailAndPassword(email, password).then(() => {
    window.location.href = "home.html";
  }).catch((error) => {
    alert("Login failed: " + error.message);
  });
}

function creatId(event) {
  event.preventDefault();
  let number = document.getElementById("number").value.trim();
  let password = document.getElementById("Pass").value;
  let confirmPassword = document.getElementById("passs").value;

  if (!number || !password || !confirmPassword) {
    alert("Please fill all fields.");
    return;
  }

  if (number.length !== 10) {
    alert("Mobile number must be exactly 10 digits.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  let email = number + "@bookmart.com";

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      let user = userCredential.user;
      db.ref("users/" + user.uid).set({
        phone: number,
        uid: user.uid
      });
      alert("Account created successfully!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
}

function postBook() {
  console.log("postBook called");
  if (!auth.currentUser) {
    alert("Please log in to post a book");
    window.location.href = "index.html";
    return;
  }

  const divElement = document.getElementById("createBooksss");
  divElement.style.display = divElement.style.display === "none" ? "flex" : "none";
}

function cancel() {
  console.log("cancel called");
  document.getElementById("createBooksss").style.display = "none";
  clearInputs();
}

function addNewBook() {
  console.log("addNewBook called");
  const bookName = document.getElementById("enterbookname").value.trim();
  const bookPrice = parseFloat(document.getElementById("enterPrice").value.trim());
  const bookPhoto = document.getElementById("addphoto").value.trim();

  console.log("Input values - Name:", bookName, "Price:", bookPrice, "Photo:", bookPhoto);

  if (!bookName || !bookPrice) {
    console.log("Validation failed: Missing name or price");
    alert("Book name and price are required");
    return;
  }
  if (!/^[A-Za-z0-9\s]+$/.test(bookName)) {
    console.log("Validation failed: Invalid book name");
    alert("Book name can only contain letters, numbers, and spaces");
    return;
  }
  if (isNaN(bookPrice) || bookPrice <= 0 || bookPrice > 1000) {
    console.log("Validation failed: Invalid price");
    alert("Price must be a number between 0 and 1000 RS");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    console.log("Validation failed: User not logged in");
    alert("You need to log in first");
    return;
  }

  const bookData = {
    name: bookName,
    price: bookPrice,
    img: bookPhoto || "https://via.placeholder.com/150",
    owner: user.uid,
    ownerEmail: user.email,
    time: new Date().toLocaleString()
  };
  console.log("Book data to be sent:", bookData);

  const newBookRef = db.ref("books").push();
  newBookRef.set(bookData).then(() => {
    console.log("Book added successfully to Firebase");
    alert("✅ Book posted successfully!");
    clearInputs();
    document.getElementById("createBooksss").style.display = "none";
  }).catch((error) => {
    console.error("Failed to add book:", error);
    alert("❌ Failed to post book: " + error.message);
  });
}

function removeBook(bookId) {
  console.log("removeBook called for bookId:", bookId);
  if (!confirm("Are you sure you want to delete this book?")) return;

  db.ref(`books/${bookId}`).remove().then(() => {
    console.log("Book deleted successfully");
    alert("Book deleted successfully");
  }).catch((error) => {
    console.error("Failed to delete book:", error);
    alert("Failed to delete book: " + error.message);
  });
}

function clearInputs() {
  console.log("clearInputs called");
  document.getElementById("enterbookname").value = "";
  document.getElementById("enterPrice").value = "";
  document.getElementById("addphoto").value = "";
}

function buyBook(ownerId, name, price, img) {
  console.log("buyBook called for ownerId:", ownerId);
  db.ref(`users/${ownerId}`).once('value').then((snapshot) => {
    const owner = snapshot.val();
    document.getElementById("buyPageImg").src = img || "https://via.placeholder.com/150";
    document.getElementById("bookPageName").innerText = `Book Name: ${name}`;
    document.getElementById("bookPagePrice").innerText = `Price: ${price} RS`;
    document.getElementById("ContactNumber").innerText = `Contact: ${owner?.phone || ownerId}`;
    document.getElementById("buyPage").style.display = "flex";
  }).catch((error) => {
    console.error("Error fetching owner data:", error);
    document.getElementById("buyPageImg").src = img || "https://via.placeholder.com/150";
    document.getElementById("bookPageName").innerText = `Book Name: ${name}`;
    document.getElementById("bookPagePrice").innerText = `Price: ${price} RS`;
    document.getElementById("ContactNumber").innerText = `Contact: ${ownerId}`;
    document.getElementById("buyPage").style.display = "flex";
  });
}

function Done() {
  document.getElementById("buyPage").style.display = "none";
}

document.getElementById("searchBtn")?.addEventListener("click", () => {
  const searchTerm = document.getElementById("searchBook").value.trim();
  loadBooks(searchTerm);
});

document.getElementById("searchBook")?.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    loadBooks(document.getElementById("searchBook").value.trim());
  }
});

document.getElementById("postBook")?.addEventListener("click", postBook);
document.getElementById("cancelBook")?.addEventListener("click", cancel);
document.getElementById("DoneBtn")?.addEventListener("click", Done);
document.getElementById("loggBtn")?.addEventListener("click", login);
document.getElementById("createForm")?.addEventListener("submit", creatId);
