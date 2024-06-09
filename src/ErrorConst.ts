export const ErrorStatusCode = {
  601: {
    __typename: "Error",
    status_code: 601,
    message: "Authorization header missing!",
  },
  602: {
    __typename: "Error",
    status_code: 602,
    message: "Invalid email id or password!",
  },
  603: {
    __typename: "Error",
    status_code: 603,
    message: "User exsist for given tax id or email.",
  },
  650: {
    __typename: "Error",
    status_code: 650,
    message: "Unauthorise User!",
  },
  651: {
    __typename: "Error",
    status_code: 651,
    message: "Email ID already exist",
  },
} as const;
