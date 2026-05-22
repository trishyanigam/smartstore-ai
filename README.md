# SmartStore AI (AI E-commerce Admin Assistant)

SmartStore AI is a premium, modern e-commerce administration platform designed to empower store owners. By integrating advanced analytics charts with state-of-the-art LLM capabilities via **OpenRouter**, the system provides automatic SEO copywriting generation, dynamic pricing advice, low-stock warnings, and real-time business insights.

---

## 🎯 Project Objective

Build a centralized assistant where store owners can manage products while a background AI analyst generates descriptive copies, automates search metadata, and delivers actionable sales trajectory insights.

---

## 🧰 Tech Stack

### Frontend
* **Core**: React (Vite)
* **Styling**: Tailwind CSS
* **Data Visualization**: Chart.js / React-Chartjs-2

### Backend
* **Runtime & Framework**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Security & Tokens**: JWT (JSON Web Tokens), bcryptjs
* **LLM Engine**: OpenAI SDK routed through OpenRouter (`openai/gpt-4o-mini`)

---

## 📌 Features Implemented

1. **User Authentication**
   * High-security registration and login flow.
   * Session state protected by JSON Web Tokens (JWT) and encrypted using `bcryptjs`.
   * Multi-role support (`customer` and `admin`).

2. **Product Management**
   * Full CRUD suite (Create, Read, Update, Delete) to maintain the store inventory.
   * Tracks titles, prices, stock levels, categories, sales counts, and custom AI tags.

3. **AI Content Generation**
   * **Product Descriptions**: Automatically generates highly-converting, descriptive copies (2-3 paragraphs) based on product category and features.
   * **SEO Optimization**: Compiles search-friendly SEO tags dynamically.
   * **Social Marketing Captions**: Auto-generates high-engagement captions with emojis and hashtags.

4. **Interactive Sales Dashboard**
   * Real-time metrics cards tracking total revenue, items sold, active inventory, and average order value.
   * Multi-dimensional Chart.js visualizations tracking monthly revenue trajectories and individual product performance.

5. **AI Sales Suggestion Engine**
   * **Pricing Recommendations**: Analyzes sales velocity and stock levels to recommend price increases, discount triggers, or keeping prices constant with data-backed rationales.
   * **Trending Product Insights**: Detects category performance surges to propose custom promotional campaigns.
   * **Inventory Alerts**: Estimates remaining days-to-exhaustion and creates restock triggers for low-inventory buffer stock.

---

## 📂 Project Structure

```text
SmartStore/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── context/        # Auth Context provider
│   │   ├── pages/          # Login, Register, Dashboard, AI insights pages
│   │   └── services/       # Axios API client setup
│   └── package.json
└── server/                 # Express Backend
    ├── config/             # DB connectivity configuration
    ├── controllers/        # Express controllers (auth, products, ai, analytics)
    ├── models/             # Mongoose schemas (User, Product, Order, Insight)
    ├── routes/             # Modular API routes
    ├── services/           # OpenAI/OpenRouter connection client
    ├── seeder.js           # Database seeder script
    ├── server.js           # Express main server engine
    └── package.json
```

---

## ⚙️ Installation & Environment Configuration

### 1. Setup Backend Environment
Create a `.env` file inside the `server/` directory and populate it with your environment parameters:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartstore?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_change_me_in_production
OPENAI_API_KEY=sk-or-v1-your-active-openrouter-key-here
NODE_ENV=development
```

### 2. Install Dependencies
Run the installation scripts for both the backend and frontend:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 🚀 Running the Application

### 1. Seed Initial Data
Run the following script inside the `server/` folder to populate your MongoDB database with pre-configured products, historical orders, and default users:

```bash
cd server
npm run data:import
```

*(To completely wipe the database clean, you can run `npm run data:destroy`)*.

### 2. Start the Development Servers

Open two terminal windows to run the frontend and backend in parallel:

#### Start Backend:
```bash
cd server
npm run dev
```

#### Start Frontend:
```bash
cd client
npm run dev
```

---

## 🔑 Default Credentials for Testing

Use the following seeded accounts to log in and immediately test the dashboard's features:

### 👤 Admin Portal User
* **Email**: `admin@smartstore.com`
* **Password**: `admin123`

### 👥 Customer Portal User
* **Email**: `john@gmail.com`
* **Password**: `customer123`