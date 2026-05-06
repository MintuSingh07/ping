function formatNumber(number) {
  try {
    // Remove all non-digit characters and spaces
    let cleaned = number.toString().replace(/\D/g, "");

    // If it starts with 91 and has 12 digits, it's already in the correct format
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      number = cleaned;
    } else if (cleaned.length === 10) {
      // If it's 10 digits, add the 91 prefix
      number = "91" + cleaned;
    } else if (cleaned.length > 10 && cleaned.endsWith(cleaned.slice(-10))) {
      // If it's longer than 10 digits, take the last 10 and add 91
      // This handles cases like 08597003989 or +91 8597003989
      number = "91" + cleaned.slice(-10);
    } else {
      number = cleaned;
    }

    console.log("Formatted number:", number);
    return {
      success: true,
      number: number,
    };
  } catch (error) {
    console.error("Error formatting number:", error);
    return {
      success: false,
      number: null,
    };
  }
}

module.exports = { formatNumber };
