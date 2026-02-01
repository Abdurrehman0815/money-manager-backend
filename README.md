# 🏦 Money Manager - Backend API

The server-side application for the Money Manager platform. This robust RESTful API handles secure user authentication, complex financial logic, real-time budget validation, and peer-to-peer (P2P) transfers.

![Status](https://img.shields.io/badge/Status-Active-success)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Live Deployment

**Base URL:** `https://money-manager-backend-73me.onrender.com`

## 🌟 Key Features

* **Secure Authentication:**
    * User Registration & Login using **JWT (JSON Web Tokens)**.
    * Password encryption using **Bcryptjs**.
    * *Auto-Setup:* Automatically creates default "Cash" and "Bank Account" portfolios upon user registration.
* **Advanced Budget Logic:**
    * **Strict Expense Rule:** Prevents users from adding expenses that exceed their total recorded income.
    * **Strict Income Rule:** Prevents users from recording income figures that exceed their actual liquid assets (Cash + Bank balance).
    * **Balance Protection:** Prevents spending from an account if funds are insufficient.
* **Transaction Management:**
    * **Deposit:** Adds real money to accounts without affecting "Income" stats (to prevent double counting).
    * **P2P Transfers:** Securely sends money to other registered users via email. (Deducts from sender as 'Expense', adds to receiver as 'Deposit').
    * **Self-Transfers:** Move funds between Cash and Bank accounts.
* **Time-Locked Security:**
    * Transactions cannot be **Edited** or **Deleted** after **12 hours** of creation to maintain historical accuracy.
* **Data Aggregation:** Uses MongoDB Aggregation pipelines to calculate real-time totals for dashboards.

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express.js](https://expressjs.com/)
* **Database:** [MongoDB](https://www.mongodb.com/) (via **Mongoose** ODM)
* **Authentication:** JWT & Bcryptjs
* **Utilities:** Dotenv, CORS, Nodemon

### **Authentication**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user & create default accounts |
| `POST` | `/api/auth/login` | Login user & return JWT token |
| `GET` | `/api/auth/me` | Get current user details |

### **Transactions**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/transactions` | Get all transactions (supports filters: date, type, category) |
| `POST` | `/api/transactions` | Add a new transaction (Deposit, Income, Expense, Transfer, P2P) |
| `PUT` | `/api/transactions/:id` | Edit a transaction (Blocked if > 12 hours) |
| `DELETE` | `/api/transactions/:id` | Delete a transaction (Blocked if > 12 hours) |
| `GET` | `/api/transactions/accounts` | Get current balances for Cash & Bank |

