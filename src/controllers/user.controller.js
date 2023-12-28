import { asyncHandler } from "../utils/asyncHandler.utils.js";

const regiasterUser = asyncHandler(async (req, res) => {
  return res.status(200).json({ message: "Ok" });
});

export { regiasterUser };
