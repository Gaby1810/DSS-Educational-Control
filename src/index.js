const express = require("express");
const app = express();

app.use(express.json());

// health check
app.get("/", (req, res) => res.send("Educational Control API running 🚀"));

// ping de prueba
app.get("/api/ping", (req, res) => res.json({ ok: true, message: "pong" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));