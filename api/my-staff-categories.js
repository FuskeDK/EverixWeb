import { getStaffCategories } from "../lib/roles.js";

export default async function handler(req, res) {
  const categories = await getStaffCategories(req);
  res.status(200).json({ categories });
}
