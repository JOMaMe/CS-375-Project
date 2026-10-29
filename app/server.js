const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

let rooms = [];

app.get("/get-code", (req, res) => {
  if (!req.query.code) {
    return res.status(400).send("code is empty");
  }
  const code = req.query.code;
  if (typeof code !== "string" || !/^[A-Za-z]{4}$/.test(code)) {
    return res.status(400).send("not a valid code format");
  }

  const normalizedCode = code.toUpperCase();
  if (rooms.includes(normalizedCode)) {
    return res.status(200).send(normalizedCode);
  }
  res.status(404).send(`code ${normalizedCode} is invalid`);
});

app.get("/get-new-code", (req, res) => {
  let code;
  do {
    code = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  } while (rooms.includes(code));

  rooms.push(code);
  res.status(200).send(code);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
