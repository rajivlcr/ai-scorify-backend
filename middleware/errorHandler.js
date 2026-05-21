export default function (
  err,

  req,

  res,

  next,
) {
  console.error(err);

  // 🚀 DEVELOPMENT
  if (process.env.NODE_ENV === "development") {
    return res.status(500).json({
      msg: err.message,

      stack: err.stack,
    });
  }

  // 🚀 PRODUCTION
  res.status(500).json({
    msg: "Something went wrong",
  });
}
