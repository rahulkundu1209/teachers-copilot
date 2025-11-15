
export function calculate(req, res) {
  const { a, b, op } = req.body;

  // simple validation
  if (typeof a !== "number" || typeof b !== "number") {
    return res.status(400).json({ error: "a and b must be numbers" });
  }

  let result;
  switch (op) {
    case "add":
      result = a + b;
      break;
    case "sub":
      result = a - b;
      break;
    case "mul":
      result = a * b;
      break;
    case "div":
      result = b === 0 ? null : a / b;
      break;
    default:
      return res.status(400).json({ error: "unknown op" });
  }

  return res.json({ result });
}
