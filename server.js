const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = 4000;

// Data store
let users = []; // Stores user information
let products = []; // Stores product information
let categories = []; // Stores categories
let shoppingBags = {}; // Stores shopping bags for each user

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/CSS", express.static(path.join(__dirname, "/CSS")));
app.use("/Pic", express.static(path.join(__dirname, "/Pic")));
app.use("/Js", express.static(path.join(__dirname, "/Js")));

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: "jklfsodifjsktnwjasdp465dd",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000, // 1 hour
      sameSite: true,
      httpOnly: true,
      secure: false, // Use HTTPS in production
    },
  })
);

// Routes
app.post("/signupform", (req, res) => {
  const { uname, psw, birthday } = req.body;
  users.push({ username: uname, password: psw, birthday });
  shoppingBags[uname] = []; // Initialize an empty shopping bag for the user
  console.log("User signed up successfully:", uname);
  res.redirect("/login");
});

app.post("/loginform", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.username = username;
    if (username.includes("_admin")) {
      res.redirect("/Office_Homeoffice");
    } else if (username.endsWith("@gmail.com")) {
      res.redirect("/");
    }
  } else {
    res.redirect("/Login?error=Invalid username or password");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/product/:category", (req, res) => {
  const category = req.params.category;
  const productsByCategory = products.filter(p => p.category_Name === category);
  res.render("SALE", { products: productsByCategory, username: req.session.username });
});

app.post("/add-to-bag", (req, res) => {
  const { product_ID, genderCheckbox, inputAlphabet, quantity } = req.body;
  const username = req.session.username;
  if (username) {
    shoppingBags[username].push({ product_ID, genderCheckbox, inputAlphabet, quantity });
    console.log("Product added to cart successfully for user:", username);
    res.redirect("/");
  } else {
    res.redirect("/Login");
  }
});

app.get("/ShoppingBag", (req, res) => {
  const username = req.session.username;
  if (!username) return res.redirect("/login");

  const userBag = shoppingBags[username];
  res.render("ShoppingBag", { shoppingBag: userBag });
});

app.post("/deleteBagItem", (req, res) => {
  const { product_ID, alphabet, size } = req.body;
  const username = req.session.username;

  if (username && shoppingBags[username]) {
    shoppingBags[username] = shoppingBags[username].filter(item =>
      item.product_ID !== product_ID || item.alphabet !== alphabet || item.size !== size
    );
    res.redirect("/ShoppingBag");
  } else {
    res.redirect("/Login");
  }
});

app.get("/category", (req, res) => {
  res.json(categories);
});

app.post("/addCategory", (req, res) => {
  const { categoryName } = req.body;
  categories.push({ category_Name: categoryName });
  console.log("Category added:", categoryName);
  res.redirect("/Office_Homeoffice");
});

app.post("/deleteCategory", (req, res) => {
  const { catID } = req.body;
  categories = categories.filter(cat => cat.category_ID !== catID);
  console.log("Category deleted:", catID);
  res.redirect("/category");
});

app.get("/Office_ProductManage", (req, res) => {
  res.render("Office_ProductManage", { products });
});

app.post("/addProduct", (req, res) => {
  const newProduct = req.body;
  products.push(newProduct);
  console.log("Product added:", newProduct);
  res.redirect("/Office_ProductManage");
});

app.post("/deleteProduct", (req, res) => {
  const { proID } = req.body;
  products = products.filter(p => p.product_ID !== proID);
  console.log("Product deleted:", proID);
  res.redirect("/Office_ProductManage");
});

app.get("/", (req, res) => {
  res.render("HOME", { username: req.session.username });
});

// Static page routes
app.get("/Login", (req, res) => res.sendFile(path.join(__dirname, "/views/Login.html")));
app.get("/Signup", (req, res) => res.sendFile(path.join(__dirname, "/views/Sign_up.html")));
app.get("/Office_Homeoffice", (req, res) => {
  res.render("Office_Homeoffice", { username: req.session.username });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
