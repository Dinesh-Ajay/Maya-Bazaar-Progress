# Maya Bazaar - Set 1

## Overview
This is the first version of my Maya Bazaar e-commerce website project.  
It demonstrates the initial functionality using **Node.js (Express)**, **HTML/CSS/JS**, and **MongoDB** for backend storage.  

This version is designed to run **locally** and shows my starting point in building a full-stack e-commerce application.

---

## Features
- Local server using **Express.js** (`e20.js`)  
- Pages served from the `e20public` folder:
  - `e20.html` → Main page  
  - `e20c.html` → Customer view  
  - `e20l.html` → Product listing  
  - `e20d.html` → Admin dashboard  
  - `e20u.html` → Update product page  
  - `e20login.html` → Login page  
- Role-based login for Admin (stored in MongoDB)  
- CRUD functionality for products:
  - **Create** → Add new products
  - **Read** → View products
  - **Update** → Edit existing products
  - **Delete** → Remove products
- Temporary in-memory storage (`tempProducts` and `tempUpdatedProducts`) for newly added and updated products
- MongoDB collections for **Electronics** and **Groceries**  

---

## How to Run Locally
1. Install dependencies:
   ```bash
   npm install express mongodb