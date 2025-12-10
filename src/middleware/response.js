// src/middleware/response.js

const customResponse = ({ res, status, message, data, length, success }) => {
  return res.status(status).json({
    success: success,
    message,
    data,
  });
};

const errorResponse = ({ res, status, error }) => {
  return res.status(status).json({
    success: false,
    message: "An error occurred",
    error: error.message || error,
  });
};

module.exports = { customResponse, errorResponse };
