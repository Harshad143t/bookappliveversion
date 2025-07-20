const auth = firebase.auth();
const db = firebase.database();

document.addEventListener("DOMContentLoaded", function () {
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
});

function loadBooks(searchTerm = '') {
  const booksRef = db.ref('books/');
  booksRef.on('value', (snapshot) => {
    const container = document.getElementById("container");
    if (!container) return;
    container.innerHTML = "";
    snapshot.forEach(childSnapshot => {
      const book = childSnapshot.val();
      book.id = childSnapshot.key;
      if (!searchTerm || book.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        displayBook(book);
      }
    });
  });
}

function displayBook(book) {
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
      <button class="buyBtn">Buy now</button>
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
  if (!auth.currentUser) {
    alert("Please log in to post a book");
    window.location.href = "index.html";
    return;
  }

  const divElement = document.getElementById("createBooksss");
  divElement.style.display = divElement.style.display === "none" ? "flex" : "none";
}

function cancel() {
  document.getElementById("createBooksss").style.display = "none";
  clearInputs();
}

function addNewBook() {
  const bookPrice = document.getElementById("enterPrice").value;
  const bookName = document.getElementById("enterbookname").value.trim();
  const bookimg = document.getElementById("addphoto").value.trim();

  if (!bookPrice || !bookName) return alert("Book name and price are required");
  if (!/^[A-Za-z0-9\s]+$/.test(bookName)) return alert("Book name can only contain letters, numbers and spaces");
  if (bookPrice > 1000) return alert("Maximum price is 1000 RS");

  const user = auth.currentUser;
  if (!user) return alert("You need to log in first");

  const newBook = {
    name: bookName,
    price: bookPrice,
    img: bookimg || "https://via.placeholder.com/150",
    owner: user.uid,
    ownerEmail: user.email,
    time: new Date().toLocaleString()
  };

  const newBookRef = db.ref("books").push();
  newBookRef.set(newBook).then(() => {
    alert("Book added successfully");
    cancel();
  }).catch((error) => {
    alert("Failed to add book: " + error.message);
  });
}

function removeBook(bookId) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  db.ref(`books/${bookId}`).remove().then(() => {
    alert("Book deleted successfully");
  }).catch((error) => {
    alert("Failed to delete book: " + error.message);
  });
}

function clearInputs() {
  document.getElementById("enterbookname").value = "";
  document.getElementById("enterPrice").value = "";
  document.getElementById("addphoto").value = "";
}

function buyBook(ownerId, name, price, img) {
  db.ref(`users/${ownerId}`).once('value').then((snapshot) => {
    const owner = snapshot.val();
    document.getElementById("buyPageImg").src = img || "https://via.placeholder.com/150";
    document.getElementById("bookPageName").innerText = `Book Name: ${name}`;
    document.getElementById("bookPagePrice").innerText = `Price: ${price} RS`;
    document.getElementById("ContactNumber").innerText = `Contact: ${owner?.phone || ownerId}`;
    document.getElementById("buyPage").style.display = "flex";
  }).catch(() => {
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
document.getElementById("submitBook")?.addEventListener("click", addNewBook);
document.getElementById("DoneBtn")?.addEventListener("click", Done);
document.getElementById("loggBtn")?.addEventListener("click", login);
document.getElementById("createForm")?.addEventListener("submit", creatId);
