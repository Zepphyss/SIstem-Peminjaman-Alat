const http = require("http");

const data = JSON.stringify({
  username: "admin", // Pastikan user ini ada di DB atau sesuaikan
  password: "password_admin", // Sesuaikan dengan password user
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

console.log("Testing Login API...");

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  const setCookie = res.headers["set-cookie"];
  if (setCookie) {
    console.log("PASS: Set-Cookie header found!");
    if (setCookie.some((c) => c.includes("token=") && c.includes("HttpOnly"))) {
      console.log("PASS: Cookie contains token and HttpOnly flag.");
    } else {
      console.log("FAIL: Cookie missing token or HttpOnly flag.");
    }
  } else {
    console.log("FAIL: No Set-Cookie header received (Login failed or misconfigured).");
  }

  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
