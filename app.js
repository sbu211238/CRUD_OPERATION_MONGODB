const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8080;
const path = require("path");

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/pizza-database")
  .then(() => console.log("Mongo Connected"))
  .catch((err) => console.log("Mongo Error", err));

// Schema
const itemSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Root route
app.get("/", (req, res) => {
  return res.send("Welcome to pizza Shop");
});

// Add item
app.post("/add-item/:item_name", async (req, res) => {
  let { item_name } = req.params;

  if (item_name) {
    // Find the smallest available ID
    let items = await Item.find().sort({ id: 1 });
    let nextId = 1;

    // Determine the smallest ID not used by any item
    for (let i = 0; i < items.length; i++) {
      if (items[i].id !== nextId) {
        break;
      }
      nextId++;
    }

    let newItem = new Item({
      id: nextId,
      name: item_name,
    });

    await newItem.save();

    return res.end(`Item ${item_name} added successfully with ID ${nextId}`);
  } else {
    return res.send("Item name is required");
  }
});

// Show all items
app.get("/show-item", async (req, res) => {
  const items = await Item.find();
  res.render("item", { items });
});

// Get item via ID
app.get("/show-item/:id", async (req, res) => {
  let id = req.params.id;
  let item_ = await Item.findOne({ id });
  if (item_) {
    return res.send(`Item at id ${id} is ${item_.name}`);
  } else {
    return res.send(`Item does not exist at id ${id}`);
  }
});

// Modify item at specific ID
app.put("/modify-item/:id/:newname", async (req, res) => {
  let id = req.params.id;
  let newname = req.params.newname;

  let item = await Item.findOne({ id });
  if (item) {
    item.name = newname;
    await item.save();
    res.send(`Name changed to ${newname}`);
  } else {
    res.send("Item not exists");
  }
});

// Delete item
app.delete("/delete-item/:id", async (req, res) => {
  let id = parseInt(req.params.id);

  let result = await Item.deleteOne({ id });

  if (result.deletedCount > 0) {
    // Adjust IDs for the remaining items
    let items = await Item.find().sort({ id: 1 });

    for (let i = 0; i < items.length; i++) {
      items[i].id = i + 1;
      await items[i].save();
    }

    return res.send(`Item deleted at id ${id}, and IDs adjusted.`);
  } else {
    return res.send(`Item does not exist at id ${id}`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server Started at port ${port}`);
});