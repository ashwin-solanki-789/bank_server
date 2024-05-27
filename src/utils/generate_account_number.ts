export default function generate_account_number() {
  // Get the current ISO timestamp and convert it to a number
  const timestamp = Date.now(); // Equivalent to new Date().getTime()

  // Generate a random number and concatenate it with the timestamp
  const randomPart = Math.floor(Math.random() * 100000);
  const combined = `${timestamp}${randomPart}`;

  // Ensure the combined string is within the max length of 10 digits
  const maxLength = 10;
  const truncated = combined.slice(0, maxLength);

  // Convert the truncated string back to a number
  return parseInt(truncated, 10);
}
