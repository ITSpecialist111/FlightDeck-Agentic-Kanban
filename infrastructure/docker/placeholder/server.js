// Placeholder MCP server — responds to /health only.
// Replace with real MCP server code from the source repositories.
const http = require("http");
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "placeholder", timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Placeholder — real MCP server not yet deployed" }));
  }
});
server.listen(PORT, () => console.log(`Placeholder MCP on port ${PORT}`));
