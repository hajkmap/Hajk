interface StandardResponseData {
  error?: Error; // Optional property that can be an Error or its subclass
  [key: string]: unknown; // Allow any other properties with string keys
}
