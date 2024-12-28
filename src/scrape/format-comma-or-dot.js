export default function formatCommaOrDot(input) {
  // Match the main number and the decimal part (if any).
  return input.replace(/(\d+)([.,])(\d{2,3})$/, (_, p1, sep, p3) => {
    // If there are exactly three digits after the separator, use a comma.
    if (p3.length === 3) {
      return p1 + "," + p3;
    }
    // If there are exactly two digits after the separator, use a dot.
    else if (p3.length === 2) {
      return p1 + "." + p3;
    }
    // Default case: leave as is.
    return _;
  });
}
