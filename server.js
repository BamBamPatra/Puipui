const express = require("express"); //get(for sendind data to server), post(input,sent client to server), listen (on port)
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./config/database");
const app = express();
const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const options = db.config;
const sessionStore = new mysqlStore(options);

app.use(bodyParser.urlencoded({ extended: true })); //Pull element from HTML to use in node js
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/CSS", express.static(path.join(__dirname, "/CSS")));
app.use("/Pic", express.static(path.join(__dirname, "/Pic")));
app.use("/Js", express.static(path.join(__dirname, "/Js")));

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.listen(4000, function () {
  console.log("server listen");
});

// Session
app.use(
  session({
    store: sessionStore,
    secret: "jklfsodifjsktnwjasdp465dd", // A secret key used to sign the session ID cookie
    resave: true, // Forces the session to be saved back to the session store
    saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store
    cookie: {
      maxAge: 3600000, // Sets the cookie expiration time in milliseconds (1 hour here)
      sameSite: true,
      httpOnly: true, // Reduces client-side script control over the cookie
      secure: false, // Ensures cookies are only sent over HTTPS //we do not impmentment HTTPS yet, so, this is false
    },
  })
);

// Sign up
app.post("/signupform", async (req, res) => {
    const { uname, psw, birthday } = req.body;
  
    const sqlSignup =
      "INSERT INTO users (username, password, birthday) VALUES (?, ?, ?)";
  
    db.query(sqlSignup, [uname, psw, birthday], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("User signed up successfully");
  
      const sqlShoppingBag = "INSERT INTO shoppingBag (username) VALUES (?)";
      db.query(sqlShoppingBag, [uname], (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/login");
      });
    });
});
  
// login 
app.post("/loginform", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    
    db.query(sql, [username, password], (err, results) => {
      if (err) {
        console.error("Error selecting user:", err);
        return res.status(500).send("Internal Server Error");
      }
  
      if (results.length > 0) {
        const nameAccout = results[0].username;
  
        if (username.includes("_admin")) {
          res.redirect("/Office_Homeoffice"); // Redirect to the admin page
          console.log(nameAccout); 
        } 
        else if (username.endsWith("@gmail.com")) {
          req.session.username = username;
          res.redirect("/"); // Redirect to the general customer page
          console.log(nameAccout); 
        } 
      } else {
        res.render("/Login?error=Invalid username or password"); // Invalid username or password
      }
    });
});

// logout
app.get("/logout", async (req, res) => {
  req.session.destroy();
  console.log("session-/logout: ", req.sessionID);
  res.redirect("/");
});

// Product list views Page (Webstore)
app.get("/product/:category", async (req, res) => {
  try {
    const category = req.params.category;

    const sql = "SELECT * FROM product WHERE category_Name = ?";

    db.query(sql, [category], (err, result) => {
      if (err) {
        console.error("Error adding category:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("user : ", req.session.username);
      const username = req.session.username;
      console.log(username);
      if (req.session.username) {
        res.render("SALE", { products: result, username: username });
      } else {
        res.render("SALE", { products: result });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Product Page (Webstore)
app.get("/productPage", (req, res) => {
  const productData = req.query.product;
  const product = JSON.parse(decodeURIComponent(productData));
  // console.log(productData);
  console.log("Product", product);

  res.render("ProductPage", {
    product: product,
  });
});

// Add product to Bag (Webstore)
app.post('/add-to-bag' , (req , res) => {
    const productID = req.body.product_ID;
    const genderCheckbox = req.body.genderCheckbox; 
    const inputAlphabet = req.body.inputAlphabet;
    const quantity = req.body.quantity;

    console.log("Product ID:", productID);
    console.log("Gender Checkbox:", genderCheckbox);
    console.log("Input Alphabet:", inputAlphabet);
    console.log("Quantity:", quantity);
    console.log("Username : ",req.session.username);

    const bagIDsql = 'SELECT shoppingBag_ID FROM shoppingBag WHERE username = (?)' 

    db.query(bagIDsql, [req.session.username], (cartErr, cartResult) => {
        if (cartErr) {
            res.redirect('/Login')
            return;
        }

        if (cartResult.length === 0) {
            res.redirect('/Login')
            return;
        }

        const bagId = cartResult[0].shoppingBag_ID;
        console.log('Bag id:', bagId);
        console.log('Product id:', productID);

        // Insert product ID into cart_details table
        const sql = 'INSERT INTO shoppingBag_Detail (shoppingBag_ID, product_ID , quantity , size , alphabet) VALUES (?,?,?,?,?)';
        const values = [bagId,productID,quantity,genderCheckbox,inputAlphabet];

        db.query(sql, values, (err, result) => {
            if (err) {
                res.redirect('/')
                return;
            }
            console.log('Product added to cart successfully');
            res.redirect('/')
        });
    });
});

// Show Product in shoppingBag (Webstore)
app.get('/ShoppingBag' , (req,res) => {

    const bagIDsql = 'SELECT shoppingBag_ID FROM shoppingBag WHERE username = (?)' 

    db.query(bagIDsql, [req.session.username], (cartErr, cartResult) => {
        if (cartErr) {
            console.error('Error fetching cart_id:', cartErr);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        if (cartResult.length === 0) {
            console.error('Cart not');
            res.redirect('/login');
            return;
        }

        const bagId = cartResult[0].shoppingBag_ID;
        console.log('Bag id:', bagId);

        const sql = 'SELECT sd.shoppingBag_ID,p.product_ID,p.product_Name,p.product_image,p.product_Price, SUM(sd.quantity) AS total_quantity, sd.alphabet, sd.size FROM product p JOIN shoppingBag_Detail sd ON p.product_ID = sd.product_ID WHERE sd.shoppingBag_ID = (?) GROUP BY sd.shoppingBag_ID, p.product_ID,p.product_Name,p.product_image,p.product_Price,sd.alphabet, sd.size;'

        db.query(sql, [bagId] , (err, rows) => {
            if (err) {
            console.error('Error show shoppingBag:', err);
            return res.status(500).send('Internal Server Error');
            }
            console.log('ShoppingBag :', rows);
            res.render('ShoppingBag' , {
                shoppingBag : rows
            })
        });
    });
});

// Delete Product in shoppingBag (Webstore)
app.post('/deleteBagItem', (req, res) => {
    const shoppingBagID = req.body.shoppingBag_ID;
    const productID = req.body.product_ID; 
    const alphabet = req.body.alphabet;
    const size = req.body.size;

    const sql = "DELETE FROM shoppingBag_Detail WHERE shoppingBag_ID = ? AND product_ID = ? AND alphabet = ? AND size = ?";
    
    // Execute the SQL query with parameters
    db.query(sql, [shoppingBagID, productID, alphabet, size], (err, result) => {
        if (err) {
            console.error("Error deleting item:", err);
            res.status(500).send("Error deleting item");
            return;
        }
        res.redirect('/ShoppingBag');
    });
});

// Show Category (BackOffice)
app.get('/category' , (req , res) => {
    const sql = 'SELECT * FROM category';
    db.query(sql, (err, rows) => {
        if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).send('Internal Server Error');
        }
        console.log('category added successfully:', rows);
        res.json(rows);
    });
});

// Add Category (BackOffice)
app.post("/addCategory", (req, res) => {
  const categoryName = req.body.categoryName;

  const sql = "INSERT INTO category (category_Name) VALUES (?)";

  db.query(sql, [categoryName], (err, result) => {
    if (err) {
      console.error("Error adding category:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log("Category added successfully:", result);
    res.redirect("/Office_Homeoffice");
  });
});

// Delete Category (BackOffice)
app.post("/deleteCategory", async (req, res) => {
  try {
    const deleteItemId = req.body.catID;
    console.log("deleting item with this id  : " + deleteItemId);

    const sql = "DELETE FROM category WHERE category_ID = ?";

    db.query(sql, [deleteItemId], (err, result) => {
      if (err) {
        console.error("Error adding category:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("Category added successfully:", result);
    });
    res.redirect("/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Edit Categoty (BackOffice)
app.post("/editCategory" , async(req,res) => {
    try {
        const category_ID = req.body.catID;
        const newCatName = req.body.newCatName;
        console.log("edit item with this id  : " + category_ID  + " Name "+ newCatName);
    
        const sql = "UPDATE category SET category_Name = ? WHERE category_ID = ?";
    
        db.query(sql, [newCatName , category_ID], (err, result) => {
          if (err) {
            console.error("Error edit category:", err);
            return res.status(500).send("Internal Server Error");
          }
          console.log("Category edit successfully:", result);
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
      res.redirect('/Office_Homeoffice'); 
})

// Show Product (BackOffice)
app.get("/Office_ProductManage", (req, res) => {
  const sql = "SELECT * FROM product";
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Internal Server Error");
    }
    // console.log('All product :', rows);
    res.render("Office_ProductManage", { products: rows });
  });
});

// Add Product (BackOffice)
app.post("/addProduct", (req, res) => {
  const {
    product_ID,
    product_Name,
    product_Price,
    product_Description,
    product_image,
    category_ID,
    category_Name,
    collection_Name,
  } = req.body;

  const sql =
    "INSERT INTO product (product_ID , product_Name , product_Price , product_Description , product_image , category_ID , category_Name , collection_Name) VALUES (?,?,?,?,?,?,?,?)";

    db.query(sql, [product_ID , product_Name , product_Price , product_Description , product_image , category_ID , category_Name , collection_Name], (err, result) => {
        if (err) {
          console.error('Error adding product:', err);
          return res.status(500).send('Internal Server Error');
        }
        // console.log('Producr added successfully:', result);
        res.redirect('/Office_ProductManage');
      });
});

// Delete Product (BackOffice)
app.post("/deleteProduct", async (req, res) => {
  try {
    const deleteItemId = req.body.proID;
    console.log("deleting item with this id  : " + deleteItemId);

    const sql = "DELETE FROM product WHERE product_ID = ?";

    db.query(sql, [deleteItemId], (err, result) => {
      if (err) {
        console.error("Error adding category:", err);
        return res.status(500).send("Internal Server Error");
      }
      console.log("Product delete successfully:", result);
    });
    res.redirect("/Office_ProductManage");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Edit Product //Sent product to edit page (BackOffice)
app.get('/edit/:product_ID', (req, res) => {
    const product_id = req.params.product_ID; // Get the product ID from the query parameter

    const sql = "SELECT * FROM product WHERE product_ID = ?";

    db.query(sql, [product_id], (err, result) => {
      if (err) {
        console.error('Error retrieving product details:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log("Result: ", result);
      res.render('Office_editProductPage', { product: result }); 
    });
});

// Edit Product (BackOffice)
app.post('/editproduct', (req, res) => {
  const { product_ID, product_Name, product_image, product_Price, product_Description, category_ID, category_Name , collection_Name } = req.body;
 
  const sql = "UPDATE product SET product_Name = ?, product_image = ?, product_Price = ?, product_Description = ?, category_ID = ?, category_Name = ? , collection_Name = ? WHERE product_ID = ?";

  db.query(sql, [product_Name, product_image, product_Price, product_Description, category_ID, category_Name, collection_Name , product_ID], (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log("Product updated successfully");
  });
  res.redirect('/Office_ProductManage'); 
});

// Order action
app.post("/order", (req, res) => {
    // Get the username from the session
    const username = req.session.username;

    // Remove items from the shopping cart for the user
    const sqlDeleteItems = "DELETE FROM shoppingBag_Detail WHERE shoppingBag_ID IN (SELECT shoppingBag_ID FROM shoppingBag WHERE username = ?)";
    db.query(sqlDeleteItems, [username], (err, result) => {
        if (err) {
            console.error("Error removing items from shopping cart:", err);
            return res.status(500).send("Internal Server Error");
        }
        console.log("Items removed from shopping cart successfully");
        // Redirect or send response as needed
        res.redirect('/'); // Example response
    });
});

// Get page
app.get("/", (req, res) => {
  console.log("user : ", req.session.username);
  // console.log(req.session);
  const username = req.session.username;
  console.log(username);
  if (req.session.username) {
    res.render("HOME", { username: username });
  } else {
    res.render("HOME");
  }
});
app.get("/Home_loged", (req, res) => {
    res.render("HOME_loged");
});
app.get("/Login", (req, res) => {
  res.sendFile(__dirname + "/views/Login.html");
});
app.get("/Signup", (req, res) => {
  res.sendFile(__dirname + "/views/Sign_up.html");
});
app.get("/payment", (req, res) => {
  res.sendFile(__dirname + "/views/payment.html");
});
app.get("/contactUs" , (req,res) => {
    res.sendFile(__dirname + "/views/ContactUs.html");
})
app.get("/Office_Homeoffice", (req, res) => {

    console.log("user : ", req.session.username);

    const username = req.session.username;
    console.log(username);
    if (req.session.username) {
        console.log("Go to office username " , username);
        res.render("Office_Homeoffice", { username: username });
        
    } else {

        res.render("Office_Homeoffice");
    }
});
app.get("/Office_ProductManage", (req, res) => {
  res.sendFile(__dirname + "/views/Office_ProductManage.html");
});
app.get("/Office_addProductPage", (req, res) => {
  res.sendFile(__dirname + "/views/Office_addProductPage.html");
});
app.get("/Office_BillSummary", (req, res) => {
  res.sendFile(__dirname + "/views/Office_BillSummary.html");
});
app.get("/Office_BestSeller", (req, res) => {
  res.sendFile(__dirname + "/views/Office_BestSeller.html");
});
