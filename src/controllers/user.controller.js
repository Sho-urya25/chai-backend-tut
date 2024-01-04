import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.refreshAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating refresh and access token"
    );
  }
};
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
  const isUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (isUser) {
    throw new ApiError(409, "User with email or username  already exits");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatarlocal file is required");
  }
  console.log(avatarLocalPath, "khjh");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
  console.log(avatar);
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

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Reghistered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body se datavlana hai
  // login using using username or email
  //find user
  // password check
  //access and refresh token is to send to user
  //send in cookies

  const { email, userName, password } = req.body;
  console.log(email, userName);
  if (!email && !userName) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found please sign in");
  }
  const isPasswordValid = await user.isCorrectPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //generate access and refresh tokens
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  console.log(
    "access token is ",
    await accessToken,
    "refreshToken is ",
    await refreshToken
  );
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", await accessToken, options)
    .cookie("refreshToken", await refreshToken, options)
    .json(new ApiResponse(200, loggedUser, "success"));
});
const logOutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfull"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefrsshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefrsshToken) throw new ApiError(401, "unauthorised request");
  try {
    const decodedToken = jwt.verify(
      incommingRefrsshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) throw new ApiError(401, "invalid  refreshtoken");
    if (user?.refreshToken !== incommingRefrsshToken)
      throw new ApiError(401, "refresh token is expired or used");

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken.options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  //check old password is correct or not
  const isPasswordCorrect = await user.isCorrectPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }
  //if the old password is correct then set a new password for this user
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, "Password changed "));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  let user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated succesfully "));
});
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading file ");
  }
  const  user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar:avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated succesfully "));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading file ");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage:coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated succesfully "));
});
export {
  loginUser,
  logOutUser,
  changeCurrentPassword,
  refreshAccessToken,
  regiasterUser,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateUserCoverImage
};
