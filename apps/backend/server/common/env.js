import dotenv from "dotenv";

const env = dotenv.config();

// If parsing resulted in an error, or simply if the parsed object is empty
// we should throw with an error message. This ensures that the
// server doesn't start with missing configuration and fails later
// when it finds out that key XYZ is missing.
if (env.error) {
  throw new Error(`Failed to load .env file: ${env.error.message}`);
}

// Parsing could've been successful, but the resulting object could still be empty.
// This is also a problem and we thrown an error in this case as well.
const parsed = env.parsed ?? {};
if (Object.keys(parsed).length === 0) {
  throw new Error(
    "Empty .env file. Please create one from .env.example and configure accordingly to your preferences."
  );
}
