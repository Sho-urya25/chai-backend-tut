import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from"../utils/ApiResponse.js"
const regiasterUser = asyncHandler(async (req, res) => {
  //! get user from frontend
  //! validation not empty
  //! check if user already exits ,email ,username
  //! check emage and avatar
  //! upload them to cloudinary
  //! creat user object
  //! removove password
  //! check muser cresation
  //! return response
  const { fullName, email, userName, password } = req.body;
  console.log("email: ", email);
  //! chexking field one by one method
  //   if (fullName == "") {
  //     throw new ApiError(400, "fullname is required");
  //   }

  //! checking all the field by one method
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "fullname is required");
  }
  const isUser = User.findOne({
    $or: [{ userName }, { email }],
  });
  if (isUser) {
    throw new ApiError(409, "User with email or username  already exits");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something wennt wrong while registering user");
  }

  return res.status(201).json(new ApiResponse(200,createdUser,"User Reghistered Successfully"));
});

export { regiasterUser };
