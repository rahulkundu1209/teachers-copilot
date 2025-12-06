import mock from "../../data/mockHistory.json";

export default function handler(req, res) {
  res.status(200).json(mock);
}
